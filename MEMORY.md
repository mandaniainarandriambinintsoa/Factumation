# MEMORY — Factupro (factumation.vercel.app)

## Derniere MAJ : 2026-05-13

## Session 2026-05-13 — Admin dashboard : subs + broadcast email
- Migration `20260513_subscription_admin_overrides.sql` : ajoute `source` (stripe|manual), `manual_expires_at`, `admin_notes` sur `subscriptions`. Index partiel sur source=manual.
- Edge function `admin` enrichie (4 nouvelles actions) :
  - `list-users-with-subs` : join users + subscriptions, retourne plan/status/source/dates.
  - `update-subscription` : POST { userId, plan?, status?, manualExpiresAt?, adminNotes? } → upsert avec source='manual'. Ne touche pas Stripe.
  - `broadcast-email` : POST { userIds[], subject, html, fromName?, replyTo? } → 1 envoi par destinataire via Resend (anti-BCC), throttle 600ms, max 500 destinataires/batch.
  - `stats` enrichi : `paidSubscriptions` (plan!=free + status=active).
- `adminService.ts` : nouveaux types `AdminUserWithSub`, `SubscriptionPlan/Status/Source`, fonctions `getUsersWithSubs`, `updateUserSubscription`, `broadcastEmail`. `callAdminFunction` refait pour supporter GET et POST avec body.
- `AdminUserList.tsx` refonte : colonnes Plan / Statut / Source / Expire / Inscrit, checkboxes sélection multi (header tout sélectionner), bouton "Envoyer email" visible si >0 sélection, modal `EditSubscriptionModal` (plan, status, expires, notes), modal `BroadcastEmailModal` (subject + HTML libre, preview, warning RGPD, résultat sent/failed).
- `database.types.ts` mis à jour à la main (3 nouvelles colonnes subscriptions).
- **ATTENTION déploiement** :
  1. Appliquer la migration SQL via Supabase dashboard ou `supabase db push`.
  2. Redéployer la edge function `admin` (`supabase functions deploy admin`).
  3. Vérifier `RESEND_API_KEY` sur le projet Supabase (déjà config pour send-email).

## Session 2026-05-13 — Notes facture/devis
- Colonne `notes TEXT` deja presente en DB sur `invoices` + `quotes` (et reflectee dans database.types.ts + SavedInvoice/SavedQuote). Wiring formulaires + persistance manquaient.
- Types : `notes?: string` ajoute a `InvoiceData` + `QuoteData`.
- i18n : 3 cles ajoutees sous `invoice.*` (FR + EN) reutilisees par les deux forms : `notes`, `notesPlaceholder`, `notesHint`.
- Forms : section "Notes" (Textarea rows=4) inseree entre Totaux et Actions dans InvoiceForm + QuoteForm.
- Preview : bloc Notes affiche en bas du document (sous Totals/Payment, border-t pt-6) conditionnel sur `formData.notes?.trim()`. `whitespace-pre-line` pour preserver les sauts de ligne.
- Persistance : `notes: data.notes?.trim() || null` ajoute dans `saveInvoice` + `saveQuote` (historyService.ts). Mapper db→front lit deja `notes`.
- tsc OK (erreurs preexistantes Html2PdfOptions/Deno non liees).

## Session 2026-05-07 — Tax deductible (%)
- Migration Supabase : colonne `tax_rate NUMERIC(5,2) DEFAULT 0 CHECK (0-100)` sur `invoices` + `quotes`.
- Types : `taxRate?: number` sur InvoiceData, QuoteData, SavedInvoice, SavedQuote. database.types.ts regenere.
- UI : champ "Taxe (%)" dans Details (Invoice + Quote), avec hint. Resume affiche Sous-total / Taxe (X%) / Total a payer (= net) si > 0.
- Calcul : `total` en DB reste le sous-total (preserve KPIs dashboard), net calcule a la volee `subtotal * (1 - taxRate/100)`.
- Commit `7bf3662`, deploy Vercel OK.

## Session 2026-05-07 — Cleanup n8n + lockfile + zod
- Bouton "Envoyer via Gmail" (admin webhook n8n) supprime de InvoiceForm + QuoteForm. Cleanup en cascade : services invoiceService.ts/quoteService.ts supprimes, constants DEFAULT_WEBHOOK_URL/DEFAULT_QUOTE_WEBHOOK_URL supprimees, i18n keys retirees.
- 3 boutons preview alignes sur 1 ligne (flex-wrap retire).
- Switch lockfile npm -> pnpm pour Vercel (commit `b19cff4`), bump `zod ^3.25.0` pour @hookform/resolvers v5 compat (commit `7fc731e`).

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

## Commits recents
- `10a5bdf` feat(admin): subscription overrides + bulk email broadcast
- `bec0184` feat(invoice/quote): add notes field shown at bottom of document
- `7bf3662` feat(invoice/quote): add deductible tax rate (%)
- `eacce2f` fix(ux): merge generate PDF + save into one context-aware button
- `647daf2` feat: add "mark as sent" action for draft invoices (avril)
- `7d73c1f` fix: proper invoice/quote status flow (avril)

## UX Flow — Facture
| Etape | Action | Status DB | KPI |
|-------|--------|-----------|-----|
| 1 | Sauvegarder | `draft` | Comptee dans total |
| 2a | Envoyer par email / 2b. Marquer envoyee | `sent` | + En attente |
| 3 | Marquer payee | `paid` | + Chiffre d'affaires |
| — | Relancer (email) | reste `sent` | Email relance envoye |

## Stripe Integration — EN COURS
- Plans : Free / Pro (9.99€) / Business (19.99€). Edge functions deployees.
- Override admin manuel disponible (source='manual', cf session 2026-05-13).
- **TODO** : feature gating UI, billing settings, webhook must respect source='manual'.

## SEO / GEO / E-E-A-T — TODO
- GEO Score 28/100 (mars 2026). llms.txt + AI crawler OK.
- [CRITICAL] Privacy policy + terms, contact reel, custom domain.
- [HIGH] Blog 1200-2000 mots + sources, author identity.
