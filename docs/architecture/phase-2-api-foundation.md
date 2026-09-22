# Phase 2 — Fondation de l'API NestJS

## Surface HTTP

| Endpoint                     | Accès         | Rôle                                  |
| ---------------------------- | ------------- | ------------------------------------- |
| `GET /api/health/live`       | public        | confirme que le processus répond      |
| `GET /api/health/ready`      | public        | vérifie Supabase Auth et la Data API  |
| `GET /api/v1/auth/me`        | Supabase JWT  | retourne le principal dérivé du jeton |
| `GET /api/docs`              | développement | interface Swagger                     |
| `GET /api/docs/openapi.json` | développement | contrat OpenAPI                       |

Toutes les futures routes sont privées par défaut. Seules les routes portant explicitement
`@Public()` contournent le guard global.

## Authentification

- Les JWT asymétriques `RS256`/`ES256` sont vérifiés localement avec le JWKS Supabase, l'issuer,
  l'audience et l'expiration.
- Les anciens JWT `HS256` sont vérifiés par `GET /auth/v1/user`; le secret JWT partagé n'entre
  jamais dans l'application.
- L'identité vient exclusivement de `sub`; aucun `userId` envoyé par le client n'est accepté comme
  principal.
- Le header Authorization et le jeton ne sont jamais journalisés.

## Protections actives

- configuration Zod validée avant le démarrage ;
- Swagger désactivé par défaut en production ;
- allowlist CORS obligatoire en production ;
- Helmet, limite de body et rate limit en mémoire ;
- erreurs `application/problem+json` sans message interne pour les erreurs serveur ;
- `x-request-id` validé ou généré et repris dans les logs structurés ;
- arrêt gracieux via les shutdown hooks NestJS.

Le rate limit devra utiliser un stockage distribué avant un déploiement multi-instance. Le probe
Data API effectue seulement un `HEAD` borné sur `clients` et ne retourne aucune donnée.

## Configuration

Voir `apps/api/.env.example`. Pendant la migration locale, les anciennes variables
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont reconnues en fallback. En déploiement, utiliser
les noms serveur `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

La clé utilisée ici est publique/anon. Aucun `service_role` n'est nécessaire ou accepté par cette
fondation.

## Vérifications automatisées

Les tests couvrent :

- configuration valide, défauts sûrs et refus d'une configuration production incomplète ;
- liveness, readiness positive et dépendance indisponible ;
- endpoint privé sans bearer token ;
- document OpenAPI ;
- JWT valide, expiré, mauvais issuer, mauvaise audience ;
- compatibilité HS256 déléguée à Supabase Auth.
