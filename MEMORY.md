# MEMORY — Factupro (factumation.vercel.app)

## Derniere MAJ : 2026-02-25

## GSC — Metriques cles (28 derniers jours : 28/01 → 24/02/2026)
- **Clics** : 1
- **Impressions** : 4
- **CTR moyen** : 25%
- **Position moyenne** : 5.8
- **Top pays** : France (1 clic), Madagascar (2 impressions, position 1)
- **Devices** : 100% Desktop, 0% Mobile
- **Sitemap** : 17 URLs (20 dans sitemap), 0 erreurs
- **Indexation** : Seule la racine `/` indexee. 17/17 pages lang-prefixed inconnues de Google
- **Score sante SEO** : 3/10

## Fix mobile (2026-02-25) — FAIT
- **Probleme** : Tailwind CSS charge via CDN (`cdn.tailwindcss.com`) = dev-only, Googlebot ne l'execute pas → page sans style pour mobile-first indexing
- **Solution** :
  - Installe `tailwindcss`, `postcss`, `autoprefixer` en devDependencies
  - Cree `tailwind.config.js`, `postcss.config.js`, `index.css` (directives @tailwind)
  - Import `index.css` dans `index.tsx`
  - Supprime le CDN script, la config inline et le preconnect CDN de `index.html`
  - CSS compile au build : 36KB dans `dist/assets/index-*.css`
- **Fichiers modifies** : `index.html`, `index.tsx`, `package.json`
- **Fichiers crees** : `tailwind.config.js`, `postcss.config.js`, `index.css`

## Fix indexation (2026-02-25) — FAIT
- **Probleme** : 17/17 pages du sitemap jamais crawlees (toutes "Unknown to Google")
- **Cause** : Redirect JS-only `/` → `/fr`, Googlebot ne suit pas toujours
- **Solution** :
  - Ajoute `<noscript><meta http-equiv="refresh" content="0; url=/fr">` dans root index.html
  - Ajoute liens `<a>` noscript vers `/fr` et `/en` pour Googlebot
  - MAJ lastmod du sitemap a 2026-02-25
  - Re-soumission du sitemap via GSC API (status: Pending processing)
- **Fichiers modifies** : `index.html`, `public/sitemap.xml`

## Actions SEO (priorite)
1. [x] Fix mobile : Tailwind CDN → build-time CSS
2. [x] Forcer indexation : noscript redirect + re-soumission sitemap
3. [ ] Deployer sur Vercel (push les changements)
4. [ ] Creer contenu SEO cible en francais (facturation, devis)
5. [ ] Enrichir schema.org (Organization, Product, BreadcrumbList)
6. [ ] Obtenir backlinks (site trop recent)
7. [ ] Optimiser title/meta pour requetes FR (position 10.5 en France)
