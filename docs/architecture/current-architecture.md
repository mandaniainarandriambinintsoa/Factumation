# Architecture actuelle de Factumation

> Audit du dépôt au 21 septembre 2026. Ce document décrit le code versionné et les informations vérifiables dans le dépôt. Il ne prétend pas être un dump de la base Supabase de production.

## 1. Résumé exécutif

Factumation est aujourd'hui une application React/Vite monolithique côté navigateur. Elle contient une SPA publique et authentifiée, appelle directement Supabase Auth, PostgREST et plusieurs Edge Functions, génère les PDF dans le navigateur avec `html2pdf.js`, et déploie une petite fonction Vercel pour les taux de change.

Le produit couvre déjà un périmètre métier important : factures, devis, clients, sociétés, informations fiscales France/Europe/Madagascar, historique et statuts, dashboard multi-devises, authentification, abonnements Stripe/Papi, email, blog, administration et internationalisation français/anglais.

La migration doit conserver ce périmètre. Le problème principal n'est pas l'absence de fonctionnalités, mais l'absence d'une frontière serveur unique : calculs, règles de plan, numérotation, accès aux données et orchestration PDF/email restent répartis entre composants React, services navigateur, Edge Functions et base Supabase.

## 2. Stack et déploiement observés

| Couche      | État actuel                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| UI          | React 19, TypeScript strict déclaré, Tailwind CSS 3, composants locaux/Radix |
| Navigation  | React Router, routes préfixées par `/fr` ou `/en`                            |
| Build       | Vite 6, pré-rendu maison de 17 pages après build                             |
| Données     | Supabase JS depuis le navigateur, PostgreSQL/Supabase                        |
| Auth        | Supabase Auth : email/mot de passe et Google OAuth                           |
| Backend     | Edge Functions Supabase Deno + une fonction Vercel `api/exchange-rates.ts`   |
| PDF         | `html2pdf.js` côté navigateur à partir du DOM React                          |
| Email       | Edge Function Supabase et Resend                                             |
| Paiements   | Stripe et Papi via Edge Functions et webhooks                                |
| i18n        | contexte React et dictionnaires JSON français/anglais                        |
| Déploiement | SPA Vercel avec rewrite général vers `index.html`                            |
| Qualité     | aucun script lint/test/typecheck ; pas de suite de tests                     |

Le `package.json` déclare pnpm 10.28.2 mais ne définit pas encore de workspace.

## 3. Vue d'ensemble des flux

```text
Navigateur React/Vite
  ├─ Supabase Auth
  ├─ Supabase PostgREST
  │    ├─ clients / companies
  │    ├─ invoices / quotes
  │    ├─ subscriptions
  │    ├─ user_preferences
  │    └─ blog_posts
  ├─ Supabase Edge Functions
  │    ├─ send-email ──> Resend
  │    ├─ create-checkout / create-portal ──> Stripe
  │    ├─ stripe-webhook <── Stripe
  │    ├─ create-papi-checkout ──> Papi
  │    ├─ papi-webhook <── Papi
  │    ├─ admin
  │    └─ keep-alive
  ├─ Fonction Vercel /api/exchange-rates ──> fournisseurs de taux
  └─ html2pdf.js ──> PDF/base64 dans le navigateur
```

Il n'existe pas d'API métier NestJS et les autres applications ne peuvent pas encore consommer Factumation comme moteur de facturation.

## 4. Routage et fonctionnalités

`App.tsx` initialise `AuthProvider`, `SubscriptionProvider`, le routeur et l'i18n. Les pages sont chargées avec `React.lazy`.

| Route logique       | Composant                 | Accès/fonction                               |
| ------------------- | ------------------------- | -------------------------------------------- |
| `/[lang]`           | `Hero` ou `HomeDashboard` | landing publique ou dashboard connecté       |
| `/[lang]/create`    | `InvoiceForm`             | création, aperçu, PDF, sauvegarde, email     |
| `/[lang]/quote`     | `QuoteForm`               | même flux pour les devis                     |
| `/[lang]/dashboard` | `Dashboard`               | historique, statuts, téléchargement, relance |
| `/[lang]/settings`  | `Settings`                | CRUD sociétés et préférences associées       |
| `/[lang]/pricing`   | `Pricing`                 | offres et initiation de paiement Papi        |
| `/[lang]/blog...`   | blog                      | contenu statique ou Supabase selon le rôle   |
| `/[lang]/admin...`  | `Admin`                   | utilisateurs, abonnements, blog, broadcast   |

La protection des pages privées est effectuée dans les composants par redirection après montage. Il n'existe pas de garde de route centralisée. Les pages de création restent volontairement utilisables sans compte pour produire un PDF ; l'authentification devient requise pour sauvegarder ou envoyer.

## 5. Logique métier existante

### 5.1 Factures et devis

`InvoiceForm.tsx` (1 148 lignes) et `QuoteForm.tsx` (1 141 lignes) prennent chacun en charge :

- l'état complet du document ;
- la sélection/création du client et de la société ;
- les coordonnées et informations fiscales ;
- les lignes, quantité et prix unitaire ;
- la devise, le moyen de paiement, les dates et les notes ;
- la génération du numéro ;
- le calcul et le formatage des montants ;
- l'aperçu officiel ;
- trois variantes de génération PDF ;
- le contrôle d'authentification et de plan ;
- la sauvegarde en base ;
- l'envoi d'email ;
- les états de chargement, succès et erreur.

Les deux fichiers sont presque des copies : un diff direct ne révèle que 227 lignes différentes sur environ 1 140. La différence métier réelle porte surtout sur le type, les libellés, `dueDate` versus `validityDate`, les statuts et le préfixe.

### 5.2 Calculs actuels et ambiguïté fiscale

La base de calcul est :

```text
base = somme(quantity × unitPrice)
taxAmount = base × taxRate / 100
net affiché = base - taxAmount
```

Le commit historique présente ce champ comme un « taux de taxe déductible ». Il s'agit donc plutôt d'une retenue/déduction que d'une TVA ajoutée. Cependant :

- `historyService` enregistre `total = base`, sans déduction ;
- l'aperçu et le PDF affichent `base - taxAmount` ;
- l'Edge Function email recalcule et affiche `base`, sans déduction ;
- les dashboards agrègent le champ `total` stocké, donc `base` ;
- `tax_rate` est stocké, mais aucun `subtotal`, `tax_amount` ou `total_due` n'est persisté.

Le sens juridique et comptable de `taxRate` doit être tranché avant toute migration des factures. Modifier directement la formule en `base + TVA` changerait les montants historiques.

Les calculs utilisent des `number` JavaScript et des multiplications flottantes. Aucun arrondi monétaire centralisé ni nombre de décimales par devise n'est défini.

### 5.3 Numérotation

Les numéros sont générés dans le navigateur :

```text
INV-<année>-<nombre aléatoire sur 3 chiffres>
DEV-<année>-<nombre aléatoire sur 3 chiffres>
```

Le préfixe vient éventuellement de la société. Aucun mécanisme transactionnel ni contrainte unique n'apparaît dans les fichiers SQL versionnés. L'utilisateur peut modifier le numéro dans le formulaire. Deux requêtes peuvent donc produire le même numéro.

### 5.4 Clients et sociétés

`clientService.ts` et `companyService.ts` font le CRUD directement via Supabase. Les sélecteurs mélangent chargement, filtrage, création/suppression, formulaire, erreurs et rendu.

Une société contient aussi des valeurs par défaut : devise, moyen de paiement, préfixes, logo, fiscalité, IBAN/BIC et drapeau `is_default`. `setDefaultCompany` ne met que la société choisie à `true` ; aucune transaction ou contrainte versionnée ne garantit une seule société par défaut. `getDefaultCompany().single()` peut donc devenir ambigu si plusieurs lignes sont marquées par défaut.

Les factures/devis stockent des snapshots texte de la société et du client, sans `company_id` ni `client_id`. C'est utile pour préserver l'historique d'un document, mais empêche une relation explicite avec les fiches sources.

Les informations fiscales du client et de la société sont visibles dans le PDF courant, mais ne figurent pas dans les colonnes typées des factures/devis. Elles risquent donc d'être perdues après rechargement d'un document historique.

### 5.5 Historique et statuts

`historyService.ts` fournit création, lecture, suppression et changement de statut. Les statuts connus sont :

- facture : `draft`, `sent`, `paid`, `cancelled` ;
- devis : `draft`, `sent`, `accepted`, `rejected`, `expired`.

Les transitions ne sont pas validées par une machine d'état. Une mise à jour écrit directement la chaîne demandée. Le dashboard duplique une partie des actions et l'appel de relance email.

### 5.6 Abonnements

Trois plans existent côté frontend : `free`, `pro`, `business`. Les limites sont calculées dans `SubscriptionContext` à partir du nombre mensuel de lignes `invoices`/`quotes`.

- Free : deux factures et deux devis par mois.
- Pro/Business : documents illimités et email activé.
- Les limites de sociétés et d'autres capacités sont décrites dans `lib/plans.ts` mais ne sont pas toutes appliquées.
- Le contrôle de quota est essentiellement UI : il intervient sur l'export PDF d'un utilisateur connecté, mais pas de façon atomique sur la sauvegarde.
- Les règles sont donc contournables par un appel direct à Supabase et sujettes aux courses concurrentes.

Les paiements et mises à jour d'abonnement sont traités par Stripe/Papi et des Edge Functions utilisant la clé service. Les migrations couvrent `subscriptions` et `papi_payments`.

### 5.7 Multi-devises

Les documents supportent EUR, USD, GBP, CAD, CHF et MGA. Le dashboard convertit les montants vers une devise de reporting avec un pivot EUR, un cache local de 24 heures, une fonction Vercel et un fournisseur de secours. Cette conversion sert au reporting ; elle ne change pas le montant légal du document.

## 6. Authentification et autorisation actuelles

1. Le navigateur utilise Supabase Auth.
2. `AuthContext` écoute la session et expose un utilisateur simplifié.
3. Les requêtes PostgREST héritent du JWT de session via le client Supabase.
4. Les RLS sont censées limiter chaque utilisateur à ses lignes.
5. Les Edge Functions authentifiées appellent `auth.getUser()` avec le bearer token.
6. L'administration combine un email codé en dur côté UI et une vérification serveur dans l'Edge Function.

Points positifs : les secrets Resend/Stripe/Papi et la clé service restent côté serveur, les webhooks Stripe vérifient leur signature, et les politiques d'abonnement n'accordent pas l'écriture aux utilisateurs.

Limites : l'autorisation métier dépend de règles réparties entre UI, RLS et fonctions ; le rôle administrateur est attaché à une adresse email ; il n'existe pas encore de principal d'intégration, de scopes, de journal d'audit unifié ni de rate limit global.

## 7. Modèle de données observé

`lib/database.types.ts` décrit huit tables. `supabase/schema.sql` n'en crée que deux et ne reflète qu'une ancienne version de leurs colonnes. Quatre migrations supplémentaires couvrent le blog, les abonnements et Papi. Le README mentionne d'autres migrations qui ne sont pas présentes dans Git.

| Table              | Rôle                                                 | Problèmes/écarts visibles                                                            |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `invoices`         | snapshots, lignes JSONB, montant, statut, PDF base64 | pas de relation client/société, pas d'unicité versionnée, fiscalité snapshot absente |
| `quotes`           | équivalent devis                                     | mêmes écarts                                                                         |
| `clients`          | carnet utilisateur et fiscalité                      | DDL/migration absente du dépôt                                                       |
| `companies`        | sociétés, banque, fiscalité, valeurs par défaut      | DDL/migration absente ; unicité du défaut inconnue                                   |
| `user_preferences` | ancien profil société et préférences                 | service non importé par l'UI actuelle ; chevauche `companies`                        |
| `subscriptions`    | état Stripe/manuel/Papi                              | schéma versionné ; type frontend incomplet pour les champs récents                   |
| `papi_payments`    | paiements Papi                                       | présent en migration, absent des types générés                                       |
| `blog_posts`       | contenu marketing                                    | présent en migration et types                                                        |

La base live n'a pas été interrogée pendant cet audit. Le précédent `SECURITY-AUDIT.md` affirme que RLS était active sur sept tables en mai 2026, mais cela constitue une preuve historique, pas une validation de l'état live actuel. Avant toute migration, un dump sans données et la liste effective des migrations/policies/grants/indexes/triggers doivent être capturés et versionnés.

## 8. RLS versionnée

Les fichiers présents définissent :

- `invoices` et `quotes` : lecture/insertion/mise à jour/suppression par `auth.uid() = user_id` ;
- `subscriptions` : lecture par propriétaire, écriture service role ;
- `papi_payments` : lecture par propriétaire, écriture service role ;
- `blog_posts` : lecture publique si publié, accès complet pour un email admin codé en dur.

Les politiques `clients`, `companies` et `user_preferences` ne sont pas versionnées dans le dépôt. Les policies de `schema.sql` utilisent encore la forme non optimisée `auth.uid()` malgré les affirmations du README sur des policies live optimisées. Il existe donc une dérive entre Git et Supabase.

## 9. Accès direct Supabase à migrer

| Zone                          | Accès direct                                           |
| ----------------------------- | ------------------------------------------------------ |
| `historyService`              | CRUD factures/devis et statuts                         |
| `clientService`               | CRUD clients                                           |
| `companyService`              | CRUD sociétés                                          |
| `preferencesService`          | CRUD préférences                                       |
| `subscriptionService`         | lecture abonnement, usages, invocation checkout/portal |
| `SubscriptionContext`         | abonnement Realtime                                    |
| `Dashboard` / `HomeDashboard` | invocation directe de l'email de relance               |
| `blogAdminService`            | CRUD blog                                              |
| `adminService`                | session et Edge Function admin                         |

Supabase Auth peut rester dans le frontend. Les accès métier en gras dans la cible — clients, sociétés, factures, devis, statuts, quotas et abonnements — doivent passer progressivement par l'API.

## 10. PDF et email

Chaque formulaire contient trois chemins proches de génération PDF : téléchargement, génération avant email et génération avant sauvegarde. La source est un nœud DOM React, avec mutation temporaire du padding. Le PDF est ensuite parfois converti en base64 et stocké directement dans PostgreSQL.

Risques :

- forte duplication et bundle PDF d'environ 984 kB minifié ;
- rendu dépendant du navigateur, des fonts et du DOM ;
- blobs base64 volumineux dans les lignes PostgreSQL ;
- impossibilité de reproduire de façon fiable un document officiel hors interface ;
- absence de version de template ou d'empreinte du document ;
- email et dashboard recalculent les montants différemment de l'aperçu.

L'Edge Function email vérifie l'utilisateur et échappe les champs injectés dans le HTML, mais accepte le destinataire et le PDF fournis par le client sans vérifier qu'ils correspondent à un document appartenant à l'appelant.

## 11. Responsabilités mélangées et dette structurelle

| Fichier/zone                         | Responsabilités mélangées                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `InvoiceForm` / `QuoteForm`          | formulaire, règles, calcul, orchestration, PDF, email, persistance, auth, abonnement, template officiel |
| `Dashboard` / `HomeDashboard`        | requêtes, agrégations, conversion de devises, statuts, email, modales et rendu                          |
| `ClientSelector` / `CompanySelector` | select, recherche, formulaire de création, mutation et suppression                                      |
| `Settings`                           | page, CRUD complet, validation et état multi-sociétés                                                   |
| services frontend                    | mapping, validation, identité, accès direct base et erreurs utilisateur                                 |
| Edge Functions                       | endpoints indépendants sans contrat partagé ni erreurs communes                                         |

Autres constats :

- beaucoup de `alert`/`confirm` et erreurs ad hoc ;
- plusieurs casts `any` malgré le mode strict ;
- pas de schémas Zod appliqués aux frontières métier ;
- collections non paginées (`select('*')`) ;
- documents et PDF chargés en base64 dans les listes ;
- aucun timeout/idempotency key/audit commun pour les opérations critiques ;
- CORS `*` sur plusieurs Edge Functions ;
- aucune observabilité structurée ni identifiant de corrélation.

## 12. Fonctionnalités à préserver explicitement

La migration doit avoir des tests de caractérisation ou une checklist pour :

1. création anonyme d'un document et téléchargement PDF ;
2. création/sélection de clients et sociétés ;
3. société par défaut et préfixes personnalisés ;
4. fiscalité EU/France et Madagascar pour les deux parties ;
5. notes, logo, coordonnées, IBAN/BIC et moyens de paiement ;
6. EUR, USD, GBP, CAD, CHF, MGA et reporting converti ;
7. historique, PDF sauvegardé/téléchargeable et statuts ;
8. relance email et envoi initial ;
9. authentification email et Google ;
10. quotas et capacités Free/Pro/Business ;
11. paiements Stripe, Papi et overrides administrateur ;
12. dashboard d'accueil, dashboard historique, blog, admin et i18n ;
13. SEO/pré-rendu existant pendant le remplacement par Next.js.

## 13. État des contrôles au moment de l'audit

État initial observé avant la baseline :

- `pnpm build` : réussi, avec pré-rendu des 17 pages.
- Avertissement build : chunk `vendor-pdf` à environ 984 kB et chunk principal à environ 439 kB.
- `pnpm exec tsc --noEmit` : échoue.
  - six erreurs de tuple `margin` dans les options `html2pdf` ;
  - une erreur de nullabilité Supabase dans `SubscriptionContext` ;
  - nombreuses erreurs parce que le même `tsconfig` inclut les Edge Functions Deno.
- Aucun linter ni test automatisé n'est configuré.

La baseline réalisée après cet audit sépare désormais les runtimes et rend `pnpm typecheck`, les tests et le build exécutables indépendamment. Les 48 avertissements lint existants sont enregistrés comme plafond temporaire : toute alerte supplémentaire fait échouer la CI. Le formatage global reste une dette connue afin d'éviter une réécriture mécanique massive dans la première PR.

## 14. Conclusion de l'audit

Le socle fonctionnel mérite d'être conservé, mais le backend actuel est une collection de capacités Supabase plutôt qu'une API métier. La migration doit d'abord rendre le schéma reproductible et caractériser les règles actuelles, puis introduire NestJS derrière des contrats stables. Factures et devis ne doivent être migrés qu'après clients/sociétés et après décision explicite sur la fiscalité, les totaux et le moment d'attribution du numéro officiel.
