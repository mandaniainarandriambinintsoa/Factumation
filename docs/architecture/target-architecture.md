# Architecture cible de Factumation

## 1. Principes directeurs

L'architecture cible est un monorepo pnpm avec deux applications déployables indépendamment :

- `apps/web` : Next.js avec App Router, responsable de l'interface, de la navigation, des formulaires, de l'i18n, de l'aperçu et de l'état local ;
- `apps/api` : NestJS, responsable de l'identité appelante, de l'autorisation, des règles métier, des calculs, des numéros, des écritures, des intégrations et des contrats API ;
- PostgreSQL/Supabase : source de vérité persistante ;
- Supabase Auth : fournisseur d'identité utilisateur conservé ;
- Edge Functions existantes : conservées pendant la transition, puis réduites aux webhooks ou remplacées seulement lorsqu'un chemin NestJS équivalent est validé.

Les décisions restent pragmatiques : modules par domaine, services applicatifs explicites et repositories testables, sans multiplier les couches lorsqu'une simple fonction pure suffit.

## 2. Vue cible

```text
Utilisateur web                    Application externe (future)
      │ Supabase JWT                    │ API key / OAuth client
      └──────────────┬───────────────────┘
                     ▼
               NestJS /api/v1
          authn → scopes → validation
                     │
        services métier transactionnels
          │          │          │
          ▼          ▼          ▼
     PostgreSQL   PDF/Storage   Email/Payments
      Supabase     provider       providers
          ▲
          │
   Next.js App Router
 UI, wizard, formulaires, aperçu, cache client prudent
```

Le web n'appelle pas directement `supabase.from(...)` pour les domaines métier migrés. Pendant la transition, une façade d'accès par fonctionnalité choisit explicitement l'ancien adapter Supabase ou le nouvel adapter HTTP ; il n'existe jamais deux écritures simultanées.

## 3. Arborescence cible

```text
Factumation/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (marketing)/
│   │   │   │   └── (app)/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── invoices/
│   │   │   │       ├── quotes/
│   │   │   │       ├── clients/
│   │   │   │       └── settings/
│   │   │   ├── manifest.ts
│   │   │   ├── layout.tsx
│   │   │   └── error.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── companies/
│   │   │   ├── invoices/
│   │   │   │   ├── api/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── schemas/
│   │   │   │   └── types/
│   │   │   ├── quotes/
│   │   │   └── subscriptions/
│   │   ├── components/ui/
│   │   ├── lib/
│   │   │   ├── api-client/
│   │   │   ├── supabase/
│   │   │   └── pwa/
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   └── sw.js
│   │   └── tests/
│   └── api/
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── companies/
│       │   ├── clients/
│       │   ├── invoices/
│       │   ├── quotes/
│       │   ├── subscriptions/
│       │   ├── pdf/
│       │   ├── email/
│       │   ├── integrations/
│       │   │   ├── api-keys/
│       │   │   ├── exchange-rates/
│       │   │   ├── papi/
│       │   │   ├── resend/
│       │   │   └── stripe/
│       │   ├── audit/
│       │   ├── common/
│       │   │   ├── errors/
│       │   │   ├── http/
│       │   │   ├── logging/
│       │   │   └── persistence/
│       │   ├── config/
│       │   ├── health/
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── test/
├── packages/
│   ├── contracts/
│   │   └── src/          # schémas Zod et types de contrat sans logique serveur
│   ├── domain/
│   │   └── src/          # money, calculs et règles pures réellement partagées
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/
│   ├── migrations/
│   └── functions/        # conservé tant que nécessaire
├── docs/
│   ├── architecture/
│   ├── adr/
│   └── runbooks/
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

Le nom `packages/shared` demandé initialement est remplacé par des packages nommés selon leur responsabilité. Si un seul petit package suffit au début, `packages/contracts` est créé et les autres attendent un besoin réel.

## 4. Frontend Next.js

L'App Router est retenu. Les pages et layouts restent Server Components par défaut ; les formulaires, aperçus PDF, sélecteurs interactifs et fonctionnalités PWA introduisent des frontières client localisées. La documentation officielle Next.js confirme l'App Router comme routeur recommandé et les pages/layouts comme Server Components par défaut.

Organisation d'une fonctionnalité facture :

```text
features/invoices/
├── api/invoice-api.ts
├── components/
│   ├── InvoiceWizard.tsx
│   ├── InvoiceClientStep.tsx
│   ├── InvoiceItemsStep.tsx
│   ├── InvoiceBillingStep.tsx
│   ├── InvoiceReviewStep.tsx
│   ├── InvoiceActions.tsx
│   └── InvoicePreview.tsx
├── hooks/
│   ├── useInvoiceDraft.ts
│   └── useInvoiceWizard.ts
├── schemas/invoice-form.schema.ts
└── types/invoice-form.ts
```

Règles :

- React Hook Form gère le formulaire et `useFieldArray` les lignes ;
- Zod valide par étape et à la soumission ;
- le calcul frontend ne sert qu'à l'aperçu ; la réponse API remplace toujours les totaux calculés localement ;
- l'adapter HTTP ajoute le JWT courant, gère `401/403/409/422/429` et propage un `requestId` ;
- aucun DTO de persistence n'est importé dans les composants ;
- les listes sont paginées et n'incluent jamais `pdfBase64` ;
- le brouillon local est versionné, associé à l'utilisateur quand il existe, et supprimé après création réussie.

### Wizard mobile

Sur mobile : Client → Prestations → Facturation → Vérification → Actions. Une barre d'actions `Précédent/Suivant` reste collée en bas en respectant les safe areas. Le state reste dans une seule instance React Hook Form montée au niveau du wizard.

Sur desktop, les mêmes sous-composants peuvent être assemblés dans une vue plus dense ; ils ne doivent pas donner naissance à un second modèle de formulaire.

Le brouillon local ne doit pas contenir inutilement de PDF ou de secret. Une première version peut utiliser `localStorage` avec une clé versionnée et une expiration ; IndexedDB ne devient utile que pour de vrais brouillons offline ou des volumes supérieurs.

## 5. Modules NestJS

Chaque module métier contient un controller fin, un service d'application, les DTO, les règles pures et un repository explicite quand il accède aux données.

| Module          | Responsabilités                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| `auth`          | extraction bearer, validation JWT Supabase, résolution du principal, gardes et scopes |
| `users`         | profil applicatif et préférences non liées à une société                              |
| `companies`     | CRUD, ownership, société par défaut, préfixes, fiscalité et coordonnées bancaires     |
| `clients`       | CRUD, recherche bornée, fiscalité et rattachement propriétaire                        |
| `invoices`      | création atomique, snapshots, totaux, numérotation, statuts, quotas et idempotence    |
| `quotes`        | mêmes responsabilités adaptées aux devis et future conversion                         |
| `subscriptions` | lecture plan/capacités, quotas et orchestration des paiements                         |
| `pdf`           | interface `PdfRenderer`, templates versionnés, stockage et métadonnées                |
| `email`         | modèles, autorisation, pièces jointes, envoi idempotent et journal d'envoi            |
| `integrations`  | adapters Stripe, Papi, Resend, taux de change et futures API keys                     |
| `audit`         | événements de sécurité et métier sans payload sensible brut                           |
| `health`        | liveness et readiness séparées                                                        |
| `common`        | filtres d'erreur, logs, request ID, pagination et primitives techniques               |

Exemple de dépendances :

```text
InvoicesController
  → CreateInvoiceService
      → CompaniesRepository
      → ClientsRepository
      → SubscriptionPolicy
      → InvoiceCalculator (pur)
      → InvoiceNumberAllocator
      → InvoicesRepository
      → AuditWriter
```

Le controller transforme HTTP en commande et réponse. Il ne calcule ni montant, ni permission, ni numéro.

## 6. Modèle de données cible

### 6.1 Principes

- conserver les tables et identifiants existants ;
- enrichir par migrations additives ;
- garder des snapshots sur chaque document pour que modifier une fiche client/société ne réécrive pas l'histoire ;
- ajouter aussi des références optionnelles pour la traçabilité ;
- représenter les montants sans flottants binaires : `numeric` PostgreSQL avec règle d'arrondi explicite, transport API sous forme de chaînes décimales ;
- ne plus stocker le PDF base64 dans la ligne à terme : objet privé Supabase Storage et métadonnées en base ;
- enregistrer les événements et envois séparément du document.

### 6.2 Tables existantes à faire évoluer

`invoices` et `quotes` conservent leurs colonnes legacy pendant la compatibilité, puis reçoivent progressivement :

| Groupe       | Colonnes proposées                                                          |
| ------------ | --------------------------------------------------------------------------- |
| Relations    | `company_id`, `client_id` nullable au départ                                |
| Totaux       | `subtotal_amount`, `tax_amount`, `total_amount`, `amount_due` en `numeric`  |
| Fiscalité    | `tax_kind`, `tax_rate`, `company_snapshot jsonb`, `client_snapshot jsonb`   |
| Cycle de vie | `issued_at`, `sent_at`, `paid_at`, `cancelled_at`, `version`                |
| PDF          | `pdf_object_path`, `pdf_template_version`, `pdf_generated_at`, `pdf_sha256` |
| API          | `created_by_type`, `created_by_id`, `idempotency_key` ou table dédiée       |

`total` et `pdf_base64` ne sont supprimés qu'après backfill, double lecture contrôlée et validation.

### 6.3 Nouvelles tables minimales

```text
document_counters
  company_id, document_type, period_key, prefix, last_value
  UNIQUE(company_id, document_type, period_key, prefix)

document_events
  id, document_type, document_id, event_type, actor_type, actor_id,
  occurred_at, metadata_json

email_deliveries
  id, document_type, document_id, recipient, provider_message_id,
  status, attempts, sent_at, last_error_code

api_clients                       # phase 10
  id, owner_user_id, name, status, created_at, revoked_at

api_credentials                   # phase 10
  id, api_client_id, key_prefix, secret_hash, scopes,
  created_at, last_used_at, expires_at, revoked_at

idempotency_records
  principal_id, endpoint, idempotency_key, request_hash,
  response_status, response_body, expires_at
```

Une clé API n'est affichée qu'une fois à la création. Seuls un préfixe identifiable et un hash lent/approprié ou un HMAC côté serveur sont stockés. Les scopes sont positifs et minimaux, par exemple `invoices:read`, `invoices:write`, `quotes:write`, limités aux sociétés autorisées.

### 6.4 Numérotation concurrente

Dans la même transaction que l'émission du document :

1. déterminer `company_id`, type, année/période et préfixe ;
2. exécuter un `INSERT ... ON CONFLICT ... DO UPDATE SET last_value = last_value + 1 RETURNING last_value` sur `document_counters` ;
3. formater `INV-2026-000001` ou `DEV-2026-000001` ;
4. insérer le document ;
5. garantir `UNIQUE(company_id, document_type, number)` ;
6. commit.

Ce mécanisme sérialise uniquement un compteur logique, fonctionne avec plusieurs instances API et reste protégé par la contrainte unique.

Décision métier requise avant implémentation : attribuer le numéro officiel à la création du brouillon ou seulement lors de l'émission. Pour une séquence légale sans trous, la recommandation est de laisser `number` nul sur le brouillon et de numéroter à l'action `issue`. Le contrat temporaire peut exposer un `displayNumber` de brouillon sans le confondre avec le numéro officiel.

## 7. API REST proposée

NestJS utilise le préfixe global `/api`, le versioning URI natif avec version `1`, et Swagger en développement sur `/api/docs`. Les endpoints privés sont protégés par défaut.

### 7.1 Conventions

- JSON en camelCase ; dates ISO 8601 ; montants décimaux sous forme de chaînes ; devises ISO 4217 ;
- pagination par curseur ou page bornée, avec maximum documenté ;
- `Idempotency-Key` obligatoire pour les créations externes et recommandé pour le web ;
- `ETag`/version optimiste ou champ `version` pour les modifications sensibles ;
- réponse d'erreur stable de type Problem Details : `type`, `title`, `status`, `code`, `detail`, `requestId`, `errors` ;
- `400` syntaxe, `401` identité, `403` permission/plan, `404`, `409` conflit, `422` règle métier, `429` limite.

### 7.2 Endpoints initiaux

```text
GET    /api/health/live
GET    /api/health/ready

GET    /api/v1/auth/me

POST   /api/v1/companies
GET    /api/v1/companies
GET    /api/v1/companies/:id
PATCH  /api/v1/companies/:id
DELETE /api/v1/companies/:id
POST   /api/v1/companies/:id/default

POST   /api/v1/clients
GET    /api/v1/clients?query=&cursor=&limit=
GET    /api/v1/clients/:id
PATCH  /api/v1/clients/:id
DELETE /api/v1/clients/:id

POST   /api/v1/invoices
GET    /api/v1/invoices?status=&cursor=&limit=
GET    /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id
POST   /api/v1/invoices/:id/issue
POST   /api/v1/invoices/:id/send
POST   /api/v1/invoices/:id/remind
POST   /api/v1/invoices/:id/mark-paid
GET    /api/v1/invoices/:id/pdf

POST   /api/v1/quotes
GET    /api/v1/quotes?status=&cursor=&limit=
GET    /api/v1/quotes/:id
PATCH  /api/v1/quotes/:id
POST   /api/v1/quotes/:id/send
POST   /api/v1/quotes/:id/accept
POST   /api/v1/quotes/:id/reject
POST   /api/v1/quotes/:id/convert-to-invoice   # phase ultérieure

GET    /api/v1/subscription
GET    /api/v1/usage
```

Les actions métier utilisent des routes d'action plutôt qu'un `PATCH status` arbitraire afin de valider les transitions et produire des événements d'audit.

### 7.3 Création de facture

Le contrat accepte soit `clientId`, soit un objet `client` à créer/sélectionner selon une règle explicite. Il ne prend jamais `userId`.

```json
{
  "companyId": "uuid",
  "client": {
    "name": "Client Example",
    "email": "client@example.com",
    "address": "..."
  },
  "items": [
    {
      "description": "Développement application",
      "quantity": "1",
      "unitPrice": "1000.00"
    }
  ],
  "currency": "EUR",
  "tax": {
    "kind": "vat",
    "rate": "20.00"
  },
  "issueDate": "2026-09-21",
  "dueDate": "2026-10-21",
  "paymentMethod": "bank_transfer",
  "notes": "..."
}
```

Réponse :

```json
{
  "id": "uuid",
  "number": null,
  "status": "draft",
  "currency": "EUR",
  "totals": {
    "subtotal": "1000.00",
    "tax": "200.00",
    "total": "1200.00",
    "amountDue": "1200.00"
  },
  "createdAt": "2026-09-21T12:00:00.000Z",
  "version": 1
}
```

Si la décision produit impose un numéro dès la création, le même allocateur transactionnel est utilisé et `number` n'est plus nul.

## 8. Authentification et autorisation

### 8.1 Utilisateur Factumation

1. Next.js utilise Supabase Auth.
2. Le client transmet `Authorization: Bearer <access token>` à NestJS.
3. Un guard global valide signature, `iss`, `aud`, `exp` et algorithme via le JWKS du projet Supabase ; avec une ancienne clé symétrique, la validation distante Supabase sert de fallback documenté.
4. Le `sub` du token devient `principal.subjectId`.
5. Le controller ne lit jamais un `userId` fourni par le payload.
6. Le service vérifie ownership et permissions côté serveur.

Les routes sont privées par défaut ; seules health, documentation en environnement autorisé et webhooks explicitement signés sont publiques.

### 8.2 Accès PostgreSQL

L'API utilise un rôle PostgreSQL dédié, à privilèges minimaux, via le pooler recommandé pour le mode de déploiement. Chaque repository exige un `ownerId`/tenant dérivé du principal. Les requêtes sélectionnent seulement les colonnes nécessaires et sont bornées.

La clé `service_role` Supabase reste réservée aux adapters qui en ont réellement besoin et n'est jamais exposée au web. Comme elle contourne RLS, elle ne doit pas être l'autorisation principale d'un repository générique.

Pendant que l'ancien frontend accède encore à PostgREST, les RLS existantes restent actives. Elles ne sont retirées qu'après preuve qu'aucun client legacy n'en dépend ; les conserver en défense supplémentaire est préférable.

### 8.3 Intégrations externes

Un guard composite résout un seul type de principal : `user`, `apiClient` ou plus tard `oauthClient`. Pour une clé `fact_live_<prefix>_<secret>` :

- lookup par préfixe non secret ;
- comparaison constante avec le hash/HMAC stocké ;
- contrôle statut, expiration, révocation, scopes et société ;
- mise à jour asynchrone/bornée de `last_used_at` ;
- rate limit par principal, pas seulement par IP ;
- audit sans journaliser la clé ni le bearer token.

Pour plusieurs instances, le stockage du rate limit doit être partagé ; le stockage mémoire ne suffit qu'en local.

## 9. Calculs métier et règles fiscales

`InvoiceCalculator` et `QuoteCalculator` sont des fonctions pures testées. Elles reçoivent des valeurs validées et renvoient chaque composant du total. Elles sont la source de vérité serveur.

Le modèle doit distinguer au minimum :

- taxe ajoutée (`vat`) : `total = subtotal + tax` ;
- retenue/déduction (`withholding`) : `amountDue = subtotal - withholding` ;
- aucune taxe (`none`).

Une unique propriété ambiguë `taxRate` n'est pas suffisante pour préserver le comportement actuel et supporter la TVA. Les règles d'arrondi, le nombre de décimales, l'ordre d'application et les valeurs négatives doivent être documentés et testés. Toute validation fiscale automatique doit annoncer son périmètre ; elle ne doit pas prétendre certifier la conformité juridique sans revue locale France/UE/Madagascar.

## 10. PDF et email

### 10.1 Abstraction

```ts
interface PdfRenderer {
  renderInvoice(input: InvoicePrintModel): Promise<RenderedDocument>;
  renderQuote(input: QuotePrintModel): Promise<RenderedDocument>;
}
```

La première implémentation serveur peut utiliser Playwright ou Puppeteer, choisie après un spike mesurant fidélité, cold start, mémoire et contraintes d'hébergement. Le template reçoit un `PrintModel` immuable issu de la base, jamais un HTML arbitraire du client.

Le fichier est stocké dans un bucket privé avec chemin non devinable, taille/type contrôlés, hash SHA-256 et URL signée courte durée. La génération doit être idempotente par `(documentId, documentVersion, templateVersion)`.

### 10.2 Migration sûre

`html2pdf.js` reste disponible tant que le rendu serveur n'a pas passé les tests visuels et métier. Les deux moteurs peuvent être comparés sur des fixtures, mais un document donné doit enregistrer le moteur et la version de template ayant produit son PDF.

L'email reçoit un `documentId`, recharge le document autorisé, obtient le PDF serveur et envoie au destinataire validé. Le client ne fournit plus un PDF base64 ni des coordonnées de document faisant foi.

## 11. Architecture PWA

Next.js fournit nativement le manifest avec l'App Router ; `app/manifest.ts` génère nom, icônes 192/512, `display: standalone`, couleurs et `start_url`. Un service worker minimal est enregistré uniquement en production/HTTPS et versionné explicitement.

Stratégie initiale :

| Ressource                                                               | Stratégie                                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| assets Next fingerprintés, icônes, fonts locales                        | cache first avec version/expiration                                           |
| manifest et shell public                                                | stale-while-revalidate prudent                                                |
| navigation authentifiée                                                 | network first avec fallback UI hors ligne, sans persister la réponse sensible |
| `/api/**`, Supabase Auth, factures, devis, clients, sociétés, dashboard | network only au départ                                                        |
| brouillon du wizard                                                     | stockage local explicite, chiffrage non promis, consentement/effacement clair |

Le service worker ne met jamais en cache les requêtes non-GET, les réponses avec `Authorization`, les URLs signées, les PDF privés ni les réponses `Set-Cookie`. Le logout nettoie les caches et brouillons liés à l'utilisateur. Le mode offline complet est une fonctionnalité ultérieure avec résolution de conflits, pas un effet secondaire du cache.

Les tests d'installation couvrent Android/Chrome et iOS/Safari pris en charge, avec icônes maskable, safe areas, clavier mobile et retour après fermeture.

## 12. Erreurs, logs et exploitation

- filtre global d'erreurs avec contrat stable et masquage des erreurs internes ;
- validation globale avec whitelist et rejet des propriétés inattendues ;
- logs JSON avec `requestId`, route, durée, principal pseudonymisé et résultat ;
- aucun bearer token, clé API, PDF, adresse complète ou payload brut dans les logs ;
- timeouts et annulation pour Supabase, Resend, Stripe, Papi et rendu PDF ;
- retries bornés uniquement pour les opérations idempotentes ;
- liveness sans dépendance, readiness avec vérification bornée des dépendances indispensables ;
- métriques de latence/erreur, génération PDF, email et webhooks ;
- arrêt gracieux du serveur et fermeture du pool.

## 13. Tests cibles

| Niveau         | Priorités                                                                       |
| -------------- | ------------------------------------------------------------------------------- |
| Unitaires      | argent/arrondi, taxes/retentions, règles de plan, transitions, format du numéro |
| Intégration DB | compteur concurrent, unique, ownership, société par défaut, transactions        |
| API            | DTO, auth, scopes, erreurs, idempotence, pagination, quotas                     |
| Contrat        | Resend, Stripe, Papi, stockage PDF                                              |
| E2E web        | auth, création wizard mobile/desktop, refresh du brouillon, création et PDF     |
| Visuels        | templates facture/devis sur jeux FR/EN, EU/MG, longues lignes et logos          |

Un test de concurrence doit lancer plusieurs créations sur le même compteur et démontrer que tous les numéros sont uniques et monotones.

## 14. Décisions à formaliser en ADR

Avant la migration du domaine facture, consigner :

1. sémantique de taxe actuelle versus TVA/retenue ;
2. attribution du numéro au brouillon ou à l'émission ;
3. bibliothèque d'accès PostgreSQL et mode de pooling selon l'hébergement ;
4. stratégie d'autorisation DB de l'API ;
5. moteur PDF et lieu d'exécution ;
6. stockage objet et politique de rétention ;
7. contrat monétaire et arrondis ;
8. conservation ou migration des Edge Functions paiement ;
9. fournisseur/stockage du rate limit distribué ;
10. politique de suppression, archivage et immutabilité des documents émis.

## 15. Références techniques officielles

- [Next.js App Router](https://nextjs.org/docs/app)
- [Guide PWA Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Versioning URI NestJS](https://docs.nestjs.com/techniques/versioning)
- [OpenAPI NestJS](https://docs.nestjs.com/openapi/introduction)
- [Authentification NestJS](https://docs.nestjs.com/security/authentication)
- [Rate limiting NestJS](https://docs.nestjs.com/security/rate-limiting)
- [JWT Supabase et JWKS](https://supabase.com/docs/guides/auth/jwts)
- [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
