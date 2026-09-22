# Plan de migration progressive

## 1. Stratégie

La migration suit le pattern de remplacement progressif : l'application Vite reste la référence fonctionnelle tant qu'une capacité Next.js/NestJS n'a pas atteint ses critères de sortie. Chaque domaine possède un seul chemin d'écriture actif à un instant donné. La lecture peut être comparée temporairement, mais aucune double écriture non transactionnelle n'est autorisée.

```text
Legacy Vite + Supabase direct
          │
          ├─ domaine non migré ──> Supabase direct
          │
          └─ domaine migré ──────> NestJS ──> PostgreSQL/Supabase

Next.js remplace ensuite les écrans un par un, sur les mêmes endpoints NestJS.
```

Chaque phase doit fournir :

- un périmètre réduit et réversible ;
- des migrations additives et un plan de retour ;
- des tests de caractérisation avant changement des règles ;
- une observabilité suffisante pour comparer erreurs et résultats ;
- une checklist des fonctionnalités préservées ;
- une décision explicite avant toute suppression legacy.

## 2. Dépendances entre domaines

```text
Schéma versionné + CI + configuration
                  │
          Auth + principal + DB
             ┌────┴────┐
         Companies   Clients
             └────┬────┘
             Calculs/Plans
                  │
              Invoices
                  │
                Quotes
                  │
       Next.js forms + wizard
                  │
                 PWA
                  │
        PDF/email server-side
                  │
      API keys / intégrations externes
```

Subscriptions influence les quotas de factures/devis et doit donc être accessible au backend avant l'écriture de ces documents. Companies fournit préfixes, devise et identité légale. Clients et companies doivent être stables avant la création de documents.

## 3. Phase 0 — Baseline et décisions bloquantes

### Objectif

Rendre l'état actuel reproductible et mesurable sans changer le comportement produit.

### Travaux

1. Valider les trois documents d'architecture.
2. Exporter depuis Supabase un schéma sans données : tables, colonnes, contraintes, indexes, fonctions, triggers, grants, RLS, policies et historique des migrations.
3. Réconcilier ce dump avec `supabase/schema.sql`, les migrations Git et `database.types.ts`.
4. Créer uniquement des migrations de rattrapage sûres ; ne jamais reconstruire les tables live.
5. Séparer les configurations TypeScript navigateur, Node et Deno.
6. Ajouter scripts `format`, `lint`, `typecheck`, `test`, `build` et CI.
7. Corriger ou isoler les erreurs TypeScript baseline afin que les nouvelles erreurs soient détectées.
8. Ajouter des tests de caractérisation sur les calculs actuels, numéros, statuts et mappings.
9. Rédiger les ADR sur taxe/retenue, numérotation, money, accès DB et PDF.
10. Définir sauvegarde/restauration Supabase et environnement staging.

### Critères de sortie

- schéma Git correspondant au schéma staging ;
- migrations rejouables sur une base vide ;
- CI verte et contrôles séparés par runtime ;
- comportement fiscal actuel capturé par des tests, même s'il est ensuite corrigé ;
- décisions métier approuvées pour les totaux et numéros.

### Retour arrière

Aucun changement de production requis. Les corrections de qualité restent des commits séparés et réversibles.

## 4. Phase 1 — Monorepo et squelettes sans bascule

### Objectif

Créer la structure pnpm sans remplacer l'application existante.

### Travaux

1. Ajouter `pnpm-workspace.yaml` et les configurations partagées minimales.
2. Garder le Vite actuel déployable pendant toute la phase.
3. Créer `apps/web` avec Next.js App Router, TypeScript strict, Tailwind et une page technique sans trafic utilisateur.
4. Créer `apps/api` avec NestJS et une application vide compilable.
5. Créer `packages/contracts` uniquement avec quelques primitives sans dépendance framework.
6. Ajouter scripts racine filtrés : `dev:legacy`, `dev:web`, `dev:api`, `build`, `typecheck`, `test`.
7. Exclure proprement `dist`, sorties Next, couverture et artefacts Deno de chaque contrôle.

### Critères de sortie

- le build legacy produit exactement les pages existantes ;
- Next.js et NestJS compilent séparément ;
- installation pnpm déterministe depuis un clone propre ;
- aucune route de production n'est basculée.

### Retour arrière

Supprimer les nouveaux workspaces et restaurer les scripts racine ; aucune donnée n'est touchée.

## 5. Phase 2 — Fondations NestJS

### Objectif

Déployer une API observable et sécurisée sans endpoint métier d'écriture.

### Travaux

- configuration validée au démarrage ;
- pool PostgreSQL/Supabase avec TLS, timeouts et arrêt gracieux ;
- `GET /api/health/live` et `/api/health/ready` ;
- préfixe `/api`, versioning URI `v1` et Swagger `/api/docs` hors production publique ;
- guard Supabase JWT global et `GET /api/v1/auth/me` ;
- validation globale, filtre Problem Details, CORS allowlist et limites de payload ;
- logs JSON, request ID et redaction ;
- rate limit de base ;
- repository test prouvant l'isolation par propriétaire ;
- pipeline de déploiement staging séparé.

### Tests

- JWT absent, expiré, mauvaise signature/audience/issuer ;
- route publique explicitement marquée ;
- utilisateur A incapable de lire une ressource B ;
- config invalide empêche le démarrage ;
- readiness échoue proprement quand la DB est indisponible.

### Critères de sortie

API staging documentée, tests auth/DB verts, aucun secret dans les logs, aucun trafic métier basculé.

## 6. Phase 3 — Clients et sociétés

### Objectif

Valider le pattern controller/service/repository avec deux domaines à risque modéré.

### Ordre

1. lecture `companies` ;
2. lecture `clients` avec pagination/recherche ;
3. création/mise à jour ;
4. suppression selon les règles de rétention ;
5. société par défaut atomique.

### Changements DB possibles

- contrainte/index partiel assurant au plus une société par défaut par utilisateur ;
- indexes de recherche et pagination mesurés ;
- contraintes de région fiscale et normalisation prudente ;
- aucune suppression/recréation des données.

### Bascule

Introduire dans le Vite legacy une façade `clientsApi`/`companiesApi`. Un flag de configuration choisit NestJS en staging puis production. Faire une bascule par domaine et pouvoir revenir à l'adapter Supabase tant qu'aucune nouvelle forme de données incompatible n'est écrite.

### Critères de sortie

- zéro appel `supabase.from('clients'|'companies')` depuis le chemin activé ;
- CRUD, ownership, validation, pagination et société par défaut couverts ;
- Swagger documente payloads, réponses et erreurs ;
- métriques comparables avant/après.

## 7. Pré-phase facturation — Contrat métier et données

Cette étape est obligatoire avant la Phase 4.

### Décisions

- distinguer TVA ajoutée, retenue et absence de taxe ;
- définir montant stocké versus montant dû ;
- définir arrondi par devise ;
- décider quand le numéro officiel est attribué ;
- définir transitions autorisées et règles d'immutabilité ;
- décider si un client inline crée toujours une fiche, déduplique ou reste un snapshot ;
- définir le quota : création de brouillon, émission, PDF ou envoi ;
- choisir rétention du PDF et des documents supprimés/annulés.

### Migration additive

Ajouter les nouvelles colonnes nullable, compteurs et contraintes compatibles. Backfiller par lots bornés, vérifier les résultats, puis seulement renforcer la nullabilité ou les checks dans une migration ultérieure.

### Compatibilité historique

Ne pas recalculer silencieusement les anciens totaux. Conserver une `calculationVersion = legacy-v1` et mapper les anciens documents vers leur comportement observé. Les nouveaux documents utilisent une nouvelle version explicite.

## 8. Phase 4 — Domaine factures

### Première tranche

```text
POST  /api/v1/invoices
GET   /api/v1/invoices
GET   /api/v1/invoices/:id
PATCH /api/v1/invoices/:id     # champs autorisés seulement sur brouillon
```

Puis actions : émission, envoi, relance, paiement et PDF.

### Transaction de création

1. principal authentifié et idempotency key validée ;
2. société chargée avec ownership ;
3. client existant autorisé ou création inline validée ;
4. plan/quota vérifié dans la même frontière serveur ;
5. calcul pur effectué ;
6. numéro alloué selon ADR ;
7. snapshots et document enregistrés atomiquement ;
8. événement d'audit écrit ;
9. réponse normalisée retournée.

PDF et email ne doivent pas bloquer la première transaction sauf exigence explicite. Une action séparée ou un job durable est préférable pour un traitement long. L'API retourne un état clair (`not_requested`, `pending`, `ready`, `failed`) plutôt qu'une promesse en arrière-plan perdue.

### Tests prioritaires

- calculs et arrondis ;
- fiscalité par mode ;
- 20+ créations concurrentes et unicité du numéro ;
- idempotence même payload, conflit si même clé/payload différent ;
- ownership société/client/document ;
- quota concurrent ;
- transitions et modification d'un document émis ;
- pagination sans PDF/base64.

### Critères de sortie

Les quatre endpoints demandés sont stables, documentés et consommables sans UI. Le frontend legacy utilise l'API pour les factures en staging, puis par pourcentage/flag en production. L'ancien service reste disponible le temps de l'observation, mais n'écrit pas en parallèle.

## 9. Phase 5 — Domaine devis

Réutiliser seulement les primitives stables : Money, lignes, snapshots, calcul et infrastructure de compteur. Garder séparées les transitions et validations propres au devis.

Ajouter les quatre endpoints CRUD, puis actions d'envoi/acceptation/rejet. La conversion devis → facture attend un contrat métier : copie immuable des snapshots/lignes, nouveau calcul versionné si nécessaire, numéro facture distinct et référence `source_quote_id`.

Critère de sortie : parité fonctionnelle avec l'historique actuel et zéro dépendance à `QuoteForm` dans le domaine serveur.

## 10. Phase 6 — Next.js et migration des écrans

### Ordre recommandé

1. shell, layouts, auth et i18n ;
2. pages publiques/SEO ;
3. dashboard en lecture ;
4. clients et sociétés ;
5. liste/détail factures ;
6. création facture ;
7. équivalent devis ;
8. settings, pricing, blog et admin.

Une route ne bascule que si ses cas loading/empty/error/unauthorized/mobile et ses analytics sont prêts. Les pages publiques peuvent être migrées plus tôt, mais cela ne doit pas retarder les frontières métier.

La compatibilité d'URL `/fr` et `/en`, les métadonnées, sitemap, robots, llms.txt et les 17 pages pré-rendues doivent être vérifiés avant bascule DNS/routing.

## 11. Phase 7 — Wizard mobile

### Livrables

- sous-composants partagés desktop/mobile ;
- validation Zod par étape et globale ;
- lignes dynamiques accessibles ;
- progression et barre d'actions sticky ;
- restauration d'un brouillon local versionné ;
- avertissement avant écrasement d'un brouillon plus récent ;
- suppression du brouillon après succès ;
- tests clavier, lecteur d'écran, petites largeurs et orientation.

### Critères de sortie

- aucun état perdu entre étapes ou après refresh volontairement testé ;
- le payload final est produit par le schéma, pas par des casts ;
- les totaux de prévisualisation correspondent aux fixtures serveur ;
- le serveur reste arbitre en cas de différence.

## 12. Phase 8 — PWA

### Ordre

1. manifest et icônes ;
2. installation Android/iOS et standalone ;
3. service worker limité aux assets statiques ;
4. fallback offline non sensible ;
5. brouillon local explicite ;
6. audit de cache et sécurité automatisé.

### Tests obligatoires

- aucune réponse `/api`, Supabase Auth, URL signée ou PDF privé dans Cache Storage ;
- logout nettoie les données utilisateur locales ;
- mise à jour du service worker ne bloque pas l'application ;
- navigation reconnectée récupère immédiatement les données fraîches ;
- installation et icônes vérifiées sur appareils réels ou matrice de navigateurs.

## 13. Phase 9 — PDF et email backend

### Étapes

1. figer des documents fixtures représentatifs ;
2. définir `PrintModel` et templates versionnés ;
3. réaliser un spike Playwright/Puppeteer dans l'hébergement cible ;
4. comparer visuellement avec le rendu legacy ;
5. stocker les nouveaux PDF dans un bucket privé ;
6. faire lire l'historique depuis storage avec fallback `pdf_base64` ;
7. envoyer par `documentId`, avec journal et idempotence ;
8. backfiller les anciens PDF si utile ;
9. retirer `html2pdf.js` seulement après parité et période d'observation.

Le paiement Stripe/Papi peut rester en Edge Functions si celles-ci sont fiables et bien isolées. Les déplacer vers NestJS n'est pas un objectif en soi ; un ADR doit comparer l'exploitation des deux options.

## 14. Phase 10 — Authentification applications externes

### Première version

- gestion admin de clients API ;
- création d'une clé affichée une fois ;
- hash/HMAC, préfixe, scopes, sociétés autorisées, expiration et révocation ;
- guard composite JWT/API key ;
- rate limit distribué ;
- audit et dernière utilisation ;
- idempotency keys ;
- guide d'intégration et exemples curl ;
- rotation avec chevauchement contrôlé de deux credentials.

OAuth client credentials n'est ajouté que si des partenaires ou une gestion centralisée des tokens le justifient.

## 15. Matrice de conservation

| Capacité actuelle             | Destination                        | Moment de retrait legacy                   |
| ----------------------------- | ---------------------------------- | ------------------------------------------ |
| Supabase Auth                 | Next.js + guard NestJS             | conservé                                   |
| CRUD clients/sociétés browser | modules NestJS                     | après Phase 3 observée                     |
| historique factures/devis     | modules NestJS                     | après Phases 4/5                           |
| calcul frontend               | aperçu uniquement                  | après validation fixtures                  |
| numéro aléatoire              | compteur transactionnel            | dès activation API facture/devis           |
| html2pdf                      | `PdfService` serveur               | après Phase 9 et fallback validé           |
| PDF base64 DB                 | storage privé                      | après backfill/lecture compatible          |
| email Edge Function           | `EmailService` ou adapter conservé | après envoi par document ID                |
| taux Vercel                   | adapter API NestJS éventuel        | quand dashboard Next l'utilise             |
| Stripe/Papi Edge Functions    | conserver ou adapter               | décision ADR, pas de suppression anticipée |
| i18n/SEO/blog/admin           | Next.js par route                  | après tests de parité                      |

## 16. Risques et mitigations

| Risque                                  | Impact                                   | Mitigation / signal de rollback                                            |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| schéma Git différent de la production   | migration destructive ou données perdues | dump live et répétition staging avant toute DDL                            |
| changement de sens de `taxRate`         | montants et documents faux               | `calculationVersion`, ADR, fixtures historiques, aucun recalcul silencieux |
| doublon ou trou de numéros              | risque métier/légal                      | transaction, compteur, unique, test concurrence, décision sur émission     |
| contournement de tenant via API         | fuite de données                         | principal serveur, owner obligatoire, tests A/B, rôle DB minimal           |
| service role utilisé trop largement     | bypass RLS                               | adapter isolé, jamais dans repository générique                            |
| quota vérifié hors transaction          | dépassement concurrent                   | règle serveur atomique/idempotente                                         |
| double écriture legacy/API              | divergence                               | un seul writer par feature flag                                            |
| PDF serveur différent du PDF actuel     | document incorrect                       | fixtures visuelles, version de template, fallback legacy                   |
| base64 et listes non bornées            | coûts/mémoire/latence                    | projection, pagination, storage privé                                      |
| cache PWA de données privées            | exposition hors ligne                    | network-only API, tests Cache Storage, purge logout                        |
| coupure OAuth/session au passage Next   | utilisateurs déconnectés                 | environnement staging, URLs de callback compatibles, rollout progressif    |
| régression SEO/i18n                     | perte de trafic/liens                    | conservation URLs, redirects, metadata, sitemap et test des locales        |
| Edge Functions et NestJS en concurrence | logique incohérente                      | inventaire d'ownership, ADR par intégration, événements idempotents        |
| rate limit mémoire multi-instance       | protection inefficace                    | stockage distribué en production                                           |
| absence de monitoring                   | incident invisible                       | métriques et logs avant bascule                                            |

## 17. Déploiement et rollback

Chaque bascule métier utilise un flag de configuration versionné par environnement. Le rollback consiste à remettre le frontend sur l'ancien adapter tant que le modèle écrit reste rétrocompatible. Après une migration qui écrit de nouvelles colonnes, l'ancien code doit continuer à ignorer ces colonnes.

Les migrations DB sont en majorité forward-fix :

- ajout nullable/index concurrent lorsque possible ;
- backfill séparé et relançable ;
- contrainte validée après contrôle ;
- suppression de colonne dans une release ultérieure seulement ;
- sauvegarde et procédure de restauration testées avant une opération irréversible.

Pour les créations avec effets externes, un rollback applicatif ne doit pas réémettre un email, recréer un paiement ou réallouer un numéro. Les clés d'idempotence et journaux d'événements protègent ces chemins.

## 18. Première PR recommandée

La première PR d'implémentation après validation de ces documents doit être une PR « baseline reproductible », pas encore une migration Next/Nest fonctionnelle.

Périmètre recommandé :

1. ajouter les scripts de qualité et la CI ;
2. séparer les `tsconfig` Vite, scripts Node et Edge Functions Deno ;
3. corriger les sept erreurs TypeScript applicatives actuelles sans changement métier ;
4. versionner un snapshot vérifié du schéma Supabase et documenter sa génération ;
5. ajouter des tests de caractérisation pour `base`, retenue actuelle, total persisté, statuts et formats de numéro ;
6. rédiger les ADR « fiscalité/totaux » et « numérotation à l'émission » avec décision produit ;
7. ne déplacer aucun fichier d'application dans cette PR.

Pourquoi ce premier changement : le monorepo et NestJS seraient construits sur un schéma incomplet et une règle de montant ambiguë si ces éléments n'étaient pas fixés d'abord. Cette PR crée une ligne de base vérifiable et réduit le risque de perdre une fonctionnalité pendant toutes les phases suivantes.

La PR suivante peut alors créer `apps/web`, `apps/api` et `packages/contracts` en parallèle du Vite existant, sans trafic ni migration de données.

## 19. Checklist d'approbation avant implémentation

- [ ] sens de la taxe/retenue validé ;
- [ ] moment de numérotation validé ;
- [ ] règle d'arrondi et représentation monétaire validées ;
- [ ] schéma Supabase live exporté et comparé ;
- [ ] politique de documents émis/suppression validée ;
- [ ] hébergement API et pool PostgreSQL choisis ;
- [ ] stockage PDF privé et rétention choisis ;
- [ ] stratégie de rollout/feature flags acceptée ;
- [ ] maintien des Edge Functions paiement décidé provisoirement ;
- [ ] critères de parité fonctionnelle acceptés.
