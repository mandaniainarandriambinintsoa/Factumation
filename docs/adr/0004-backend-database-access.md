# ADR 0004 — Accès aux données depuis NestJS

- Statut : accepté pour la migration initiale
- Date : 2026-09-21

## Contexte

Les données Factumation sont déjà dans Supabase/PostgreSQL et protégées par RLS. Le schéma live
n'a pas encore pu être exporté avec un rôle privilégié. Connecter immédiatement NestJS avec le
`service_role` ou un rôle PostgreSQL propriétaire contournerait ces politiques et augmenterait le
risque de fuite inter-tenant pendant la migration.

## Décision

Les repositories métier initiaux utiliseront la Data API Supabase avec :

- la clé publique serveur (`SUPABASE_ANON_KEY`) ;
- le JWT utilisateur vérifié, propagé comme jeton d'accès à Supabase ;
- les politiques RLS existantes comme deuxième barrière après l'ownership vérifié dans le service ;
- des projections explicites, filtres d'owner et collections paginées.

Le `service_role` reste interdit dans les repositories génériques. Une opération administrative qui
en aurait réellement besoin devra utiliser un adapter séparé, des méthodes limitées et des tests
d'autorisation dédiés.

Une connexion PostgreSQL directe pourra être ajoutée après le snapshot vérifié du schéma pour les
transactions qui ne peuvent pas être exprimées sûrement via la Data API, notamment l'allocation
concurrente des numéros et les écritures atomiques de documents. Elle utilisera alors un rôle dédié
à privilèges minimaux, TLS, un pool borné et des fonctions/migrations versionnées.

## Conséquences

- La migration des lectures clients/sociétés peut commencer sans secret administratif.
- Le JWT transmis à un repository reste un secret de requête et ne doit jamais être journalisé.
- Une vérification backend de l'ownership reste obligatoire ; la RLS ne remplace pas les règles du
  domaine.
- La readiness vérifie Supabase Auth et une lecture `HEAD` bornée de la Data API.
- Les transactions de facturation attendent le snapshot du schéma et la stratégie PostgreSQL
  dédiée ; aucune pseudo-transaction multi-requêtes ne sera introduite.
