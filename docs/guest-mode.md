# Création de documents en mode invité

Les routes `/{locale}/invoices/new` et `/{locale}/quotes/new` sont accessibles sans connexion. Le composant serveur `NewDocumentPage` vérifie la session avant tout chargement de sociétés ou de clients. Les autres routes du compte conservent leur layout protégé ; aucun endpoint API privé n’est rendu public.

Sans session, le formulaire utilise uniquement les informations saisies en mémoire. Le numéro du document est manuel et n’est pas réservé dans un compte. L’aperçu et le PDF reprennent les calculs du domaine existant. Le téléchargement utilise `html2pdf.js` dans le navigateur ; il ne crée ni document, ni société, ni client en base, ni brouillon local. Quitter le formulaire efface la saisie. L’envoi, l’historique, l’assistant et les données sauvegardées restent dans le parcours connecté.

## Vérification locale isolée

Construire et démarrer le frontend avec des valeurs fictives (ne pas utiliser de configuration de production) :

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-test-public-key \
NEXT_PUBLIC_API_URL=http://127.0.0.1:54329/api/v1 \
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100 \
pnpm build:web

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-test-public-key \
NEXT_PUBLIC_API_URL=http://127.0.0.1:54329/api/v1 \
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100 \
pnpm --filter @factumation/web start --hostname 127.0.0.1 --port 3100
```

Dans un autre terminal, lancer Playwright centralisé (Chromium avec sandbox, un worker). La suite démarre son propre serveur de fixtures sur `127.0.0.1:54329` et bloque les requêtes navigateur externes :

```bash
PLAYWRIGHT_BROWSERS_PATH=/home/codex-dev/.cache/ms-playwright \
node /srv/dev/tools/browser/node_modules/@playwright/test/cli.js test \
  --config apps/web/e2e/playwright.config.mjs

pnpm --filter @factumation/api exec vitest run test/app.e2e.spec.ts
```

Les tests couvrent la validation, les calculs, l’aperçu, la modification, le téléchargement des deux types de PDF, le devis sur mobile, l’absence d’appels aux données du compte en mode invité, les redirections des pages privées et les formulaires authentifiés avec leurs actions avancées. Les tests API vérifient les refus d’accès aux sociétés, clients, documents et à l’envoi sans authentification.
