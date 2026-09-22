# Capturer le schéma Supabase sans données

## Objectif

Créer une source de vérité versionnée avant toute migration NestJS. Le snapshot doit contenir les tables, colonnes, contraintes, indexes, fonctions, triggers, grants, RLS et policies, sans ligne métier ni secret.

## Pré-requis

- Supabase CLI installée et authentifiée ;
- projet lié au bon environnement ;
- accès autorisé au schéma, idéalement sur staging avant production ;
- sauvegarde vérifiée avant toute future migration.

## Procédure

```bash
supabase link --project-ref <project-ref>
supabase migration list
supabase db dump --linked --schema public --file supabase/schema.snapshot.sql
supabase gen types typescript --linked --schema public > lib/database.types.generated.ts
```

Le fichier généré doit être relu avant commit afin de vérifier qu'il ne contient ni données ni secret. Ne pas remplacer `lib/database.types.ts` avant comparaison explicite.

## Contrôles

Comparer au minimum :

- tables attendues : `invoices`, `quotes`, `clients`, `companies`, `user_preferences`, `subscriptions`, `papi_payments`, `blog_posts` ;
- contraintes uniques sur utilisateur, numéros et références de paiement ;
- clés étrangères et `ON DELETE` ;
- indexes utilisés par ownership, dates, statuts et recherches ;
- RLS activée sur chaque table exposée ;
- policies et grants des rôles `anon`, `authenticated`, `service_role` ;
- triggers `updated_at` et création d'abonnement ;
- fonctions `SECURITY DEFINER` avec `search_path` fixé.

## Situation actuelle

Le dépôt est lié au projet Supabase FactuPro et le CLI peut introspecter le catalogue via l'API de gestion. Le 22 septembre 2026, cette vérification a confirmé les huit tables legacy attendues, leur RLS active et les 12 migrations historiques distantes. Le dump SQL complet reste bloqué localement tant que Docker ou Podman n'est pas installé ; il doit être capturé avant le cutover avec la commande ci-dessus.
