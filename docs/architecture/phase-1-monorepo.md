# Phase 1 — Monorepo sans bascule

## État

La racine reste l'application Vite de production. Les nouveaux workspaces sont isolés et aucune
route, configuration Vercel ou source de données de production ne pointe vers eux.

```text
Factumation/
├── apps/
│   ├── api/                 # squelette NestJS, port 3001 par défaut
│   └── web/                 # squelette Next.js App Router, page noindex
├── packages/
│   ├── contracts/           # schémas et types de frontière partagés
│   └── typescript-config/   # règles TypeScript strictes communes
└── <application Vite actuelle>
```

## Commandes

```bash
pnpm install --frozen-lockfile

pnpm dev:legacy
pnpm dev:web
pnpm dev:api

pnpm build                 # build Vite de production inchangé
pnpm build:web
pnpm build:api
pnpm build:workspaces
pnpm check                 # qualité et builds legacy + workspaces
```

Le serveur Next utilise le port `3000`. L'API utilise `PORT` si cette variable est valide, sinon
le port `3001`. Son unique route temporaire est `GET /health`. Les endpoints versionnés et les
health checks `live`/`ready` seront introduits en phase 2 avec la configuration, l'observabilité et
les protections HTTP correspondantes.

## Invariants de cette phase

- `pnpm build` continue de produire les 17 pages statiques du frontend Vite.
- La page Next est un Server Component statique et porte une directive `noindex`.
- Aucun client Supabase, secret ou variable métier n'est présent dans les nouveaux workspaces.
- Aucun schéma ni aucune donnée Supabase n'est modifié.
- Le retour arrière consiste à retirer `apps/`, `packages/`, `pnpm-workspace.yaml` et les scripts
  associés ; l'application legacy ne dépend d'aucun de ces éléments.
