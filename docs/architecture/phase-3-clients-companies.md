# Phase 3 — Clients et sociétés

## API implémentée

Toutes les routes utilisent le préfixe `/api/v1`, exigent un JWT Supabase et dérivent l'owner du
claim `sub`.

### Clients

- `GET /clients?page=1&limit=20&search=...`
- `GET /clients/:id`
- `POST /clients`
- `PATCH /clients/:id`
- `DELETE /clients/:id`

### Sociétés

- `GET /companies?page=1&limit=20&search=...`
- `GET /companies/default`
- `GET /companies/:id`
- `POST /companies`
- `PATCH /companies/:id`
- `PATCH /companies/:id/default`
- `DELETE /companies/:id`

## Garanties

- Chaque requête repository filtre explicitement `user_id`, en plus des politiques RLS.
- Le client Supabase est créé par requête avec le JWT validé ; aucune session n'est partagée.
- Les listes sont paginées et bornées à 100 éléments, avec projection explicite des colonnes.
- La recherche refuse la syntaxe qui pourrait modifier un filtre PostgREST.
- Les identifiants fiscaux et coordonnées sont validés à la frontière HTTP.
- Les réponses ne contiennent jamais `user_id`.
- Une mise à jour vide est refusée avant l'accès aux données.

## Société par défaut

La migration `20260921_atomic_default_company.sql` est préparée mais non appliquée. Elle :

1. réconcilie de façon déterministe d'éventuels doublons historiques ;
2. ajoute un index partiel garantissant au plus une société par défaut par utilisateur ;
3. fournit une fonction `SECURITY INVOKER` ;
4. sérialise les changements concurrents par utilisateur avec un advisory lock ;
5. refuse l'accès à `anon` et accorde l'exécution uniquement à `authenticated`.

Cette migration doit être répétée sur staging après le snapshot de schéma, puis seulement être
appliquée en production. Jusqu'à cette application, la route de mutation ne doit pas recevoir de
trafic.

## État de bascule

Les modules compilent, sont documentés dans OpenAPI et leurs règles de service sont testées. Le
frontend legacy continue d'utiliser ses services Supabase directs. La bascule attend :

- un compte de test staging authentifié ;
- le snapshot du schéma live ;
- l'application et la validation de la migration société par défaut ;
- les tests CRUD/RLS utilisateur A contre utilisateur B ;
- le déploiement staging de l'API.
