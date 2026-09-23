# Déploiement et bascule contrôlée

## Préconditions bloquantes

La production ne doit pas être basculée tant que ces contrôles ne sont pas verts :

1. capturer le schéma Supabase réel selon `supabase-schema-snapshot.md` ;
2. répéter les migrations `20260719` à `20260926` sur un projet staging restauré depuis une sauvegarde récente ;
3. vérifier les contraintes, RLS, fonctions, compteurs, quotas et le bucket privé `document-pdfs` ;
4. déployer les Edge Functions modifiées (`admin`, `create-checkout`, `create-portal`, `create-papi-checkout`, `send-email`) ;
5. fournir un webhook contact HTTPS et tester sa signature/authentification côté automatisation ;
6. exécuter `pnpm check`, puis les parcours de recette ci-dessous.

Les neuf migrations en attente sont additives. Elles ne remplacent ni ne suppriment les colonnes legacy. Aucun nettoyage de l'ancienne application ne doit intervenir avant la fin de la période d'observation.

## État vérifié le 22 septembre 2026

- le projet local est lié au projet Supabase FactuPro actif ;
- les 12 migrations historiques locales et distantes sont alignées ;
- `supabase db push --linked --dry-run` ne propose que les neuf migrations attendues ;
- le catalogue distant confirme les huit tables legacy et leur RLS active ;
- le lint SQL distant ne remonte aucune erreur ;
- les migrations passent sur PostgreSQL embarqué avec les objets Blog/Papi déjà présents ;
- toutes les Edge Functions passent le type-check Deno ;
- **bloquant** : aucune sauvegarde physique ni PITR n'est disponible ;
- **bloquant** : aucune branche Supabase staging n'existe ;
- **bloquant** : le projet Vercel actuel ne contient encore que les deux variables `VITE_*` legacy et aucun projet API séparé.

Ne pas exécuter `supabase db push` tant qu'une sauvegarde restaurable et une répétition staging ne sont pas confirmées.

## Projets Vercel

Créer deux projets reliés au même dépôt :

| Projet            | Root Directory | Framework | Domaine attendu         |
| ----------------- | -------------- | --------- | ----------------------- |
| `factumation-api` | `apps/api`     | NestJS    | URL Vercel dédiée       |
| `factumation`     | `apps/web`     | Next.js   | domaine public existant |

Vercel doit autoriser les sources du workspace situées hors de chaque Root Directory. Le dépôt utilise `pnpm-workspace.yaml` et les dépendances internes sont déclarées explicitement.

### Variables API

- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret serveur, jamais exposé au Web)
- `API_KEY_PEPPER` (secret aléatoire stable d'au moins 32 caractères)
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `CORS_ORIGINS=https://<domaine-web>`
- `ENABLE_SWAGGER=false`
- `CONTACT_WEBHOOK_URL`
- `CONTACT_WEBHOOK_SECRET` (secret partagé avec l'automatisation n8n)
- `OPENROUTER_API_KEY` (secret serveur requis pour la capture photo et la dictée)
- `OPENROUTER_EXTRACTION_MODEL` et `OPENROUTER_TRANSCRIPTION_MODEL`
- `OPENROUTER_TIMEOUT_MS=55000`
- limites et timeouts documentés dans `apps/api/.env.example`

### Variables Web

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL=https://<domaine-api>/api/v1`
- `NEXT_PUBLIC_SITE_URL=https://<domaine-web>`

Les variables `VITE_*` restent en place jusqu'au rollback final de l'ancien frontend.

### Secrets Edge Functions

Conserver les secrets existants Stripe, Papi et Resend, puis ajouter ou vérifier :

- `PUBLIC_SITE_URL=https://<domaine-web>` ;
- identifiants Stripe et IDs de prix ;
- clé Papi et URL d'API ;
- clé Resend.

## Ordre de déploiement

1. sauvegarde Supabase vérifiée et restauration testée ;
2. migrations sur staging, recette, puis production ;
3. Edge Functions ;
4. API NestJS en preview, puis production ;
5. renseigner l'URL API dans le projet Web ;
6. Web Next.js en preview ;
7. recette authentifiée et publique ;
8. promotion du Web en production ;
9. observation renforcée sans supprimer Vite.

## Recette obligatoire

- inscription, connexion, OAuth callback et déconnexion ;
- création/modification client et entreprise, entreprise par défaut ;
- création facture/devis desktop et mobile, restauration volontaire d'un brouillon ;
- émission concurrente sans doublon de numéro ;
- quotas Free et droits Pro/Business ;
- téléchargement PDF brouillon et PDF émis privé ;
- envoi e-mail idempotent, passage facture à payée, devis accepté/rejeté ;
- checkout Stripe, retour portail, paiement Papi et webhook ;
- admin : statistiques, liste et override abonnement ;
- `/fr`, `/en`, blog, sitemap, robots, manifest, mode hors ligne ;
- confirmation qu'aucune réponse API, session, URL signée ou PDF n'est dans Cache Storage.

## Rollback

1. promouvoir immédiatement le dernier déploiement Vite connu sain ;
2. conserver les migrations additives et les nouvelles lignes : ne pas lancer de rollback SQL destructif ;
3. désactiver les writers Next/Nest en retirant l'URL API du frontend promu ;
4. conserver les logs API/Edge et les événements d'audit ;
5. diagnostiquer puis effectuer un forward-fix sur staging avant une nouvelle bascule.

Le nettoyage legacy peut commencer uniquement après validation métier, absence d'alertes et confirmation qu'un rollback applicatif n'est plus requis.
