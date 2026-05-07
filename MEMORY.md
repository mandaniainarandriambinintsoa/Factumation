# MEMORY — Factupro (factumation.vercel.app)

## Derniere MAJ : 2026-05-07

## Session 2026-05-07 — UX fix preview buttons
- Probleme : le bouton "Generer PDF" telechargeait sans sauvegarder en DB → friction (PDF sur disque mais pas dans l'app).
- Fix : fusion en 1 bouton conditionnel sur `user`.
  - Connecte : "Enregistrer" → save DB + download PDF (handleSaveToHistory enrichi avec download via Blob URL).
  - Non connecte : "Telecharger PDF" seul (handleGeneratePdf inchange) + hint "Connectez-vous pour conserver".
- Hints visibles sous chaque bouton pour clarifier les 2 modes.
- Mise a jour i18n FR/EN : `invoice.save` → "Enregistrer", `generatePdf` → "Telecharger le PDF", + nouvelles cles `saveHint`, `downloadOnlyHint`. Success messages reecrits.
- Applique sur InvoiceForm.tsx ET QuoteForm.tsx.
- Cleanup : import `LogIn` retire (plus utilise).


## Etat actuel
- **Build** : OK, deploy auto Vercel
- **Auth** : Google OAuth + email
- **Dashboard** : HomeDashboard (KPIs) pour users connectes, Hero (LP) pour visiteurs
- **Invoice flow** : draft → sent (email ou manuel) → paid (avec relance email)
- **Email** : Resend edge function v8 (invoice/quote/reminder)
- **UI** : shadcn/ui en cours — primitives (`components/ui/`) + `lib/utils.ts` (cn)

## Refactor shadcn/ui — COMPLET (hors Admin/Blog)
### Migré
- Setup : Radix, CVA, clsx, tailwind-merge, tailwindcss-animate, react-hook-form, sonner
- Primitives : Button, Card, Dialog, Sheet, Input, Label, Badge, Textarea, Skeleton, Toaster
- Chrome : `AuthModal`, `Navbar`, `Sidebar`, `SidebarTopBar`, `App.tsx` (Toaster mount)
- Marketing : `Contact` (form complet), `Pricing` (Button)
- Forms : `InvoiceForm` (1200+ l), `QuoteForm` (1200+ l), `Settings` (760+ l) — tous inputs/textarea/label/buttons migrés, selects laissés en raw (pas de Select primitive)
- Dashboard : `Dashboard`, `HomeDashboard` — action buttons ghost icon, modals convertis en Radix Dialog
- Sélecteurs : `ClientSelector`, `CompanySelector` (+ fix bug `region.name` → `t(region.nameKey)`)
- End-to-end testé via chrome-devtools : landing → InvoiceForm (fill) → Preview → **Generate PDF** → success screen ✓

### Non migré (non-critique)
- `Admin` + `components/admin/*` — backoffice, rare usage
- `BlogList`, `BlogPost` — contenu SEO-rendu, pas de form

## Commits recents (session 2026-04-08)
- `647daf2` feat: add "mark as sent" action for draft invoices
- `7d73c1f` fix: proper invoice/quote status flow (draft → sent → paid)
- `b584261` feat: add mark-as-paid and send-reminder actions on dashboard invoices
- `eb2c1a1` feat: show dashboard with KPIs instead of landing page for logged-in users
- `21f0a75` fix: remove user info from desktop top bar (already in sidebar)
- `e841c40` feat: sidebar navigation for logged-in users

## UX Flow — Facture
| Etape | Action | Status DB | KPI |
|-------|--------|-----------|-----|
| 1 | Sauvegarder | `draft` | Comptee dans total |
| 2a | Envoyer par email | `sent` | + En attente |
| 2b | Marquer envoyee (manuel) | `sent` | + En attente |
| 3 | Marquer payee | `paid` | + Chiffre d'affaires |
| — | Relancer (email) | reste `sent` | Email relance envoye |

## Stripe Integration — EN COURS
- Plans : Free / Pro (9.99€) / Business (19.99€)
- DB : Table `subscriptions`, RLS, auto-create on signup
- Edge Functions creees, PAS toutes deployees
- **TODO** : secrets, webhook config, feature gating, billing Settings

## SEO / GEO
- Pre-rendering : 17 fichiers HTML statiques
- GEO Score : 28/100 (mars 2026, avant fixes)
- llms.txt + AI crawler rules
- **TODO** : expand blog 1500+ mots, author bios, brand profiles, custom domain

## E-E-A-T — TODO
1. [CRITICAL] Privacy policy + terms
2. [CRITICAL] Contact info reel
3. [CRITICAL] Custom domain
4. [HIGH] Blog articles 1200-2000 mots + sources externes
5. [HIGH] Author identity + bio
6. [MEDIUM] Internal links, images, case studies
