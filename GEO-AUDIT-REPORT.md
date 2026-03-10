# GEO Audit Report: Factumation

**Audit Date:** 2026-03-10
**URL:** https://factumation.vercel.app
**Business Type:** SaaS (Free Invoice/Quote Generator)
**Pages Analyzed:** 16
**Target Markets:** France, Madagascar, Afrique francophone

---

## Executive Summary

**Overall GEO Score: 28/100 (Poor)**

Factumation has critical gaps across nearly every GEO dimension. The site is **largely invisible to AI systems** — zero brand presence on the open web, thin content (150-450 words per page), blog article bodies not fully pre-rendered in static HTML, no llms.txt, missing Organization schema, and no author attribution. The strongest area is technical infrastructure (62/100) thanks to Vercel hosting, proper hreflang, and existing pre-rendering — but even this is undermined by the pre-rendering script only outputting stub content. **The single most impactful fix is ensuring full page content appears in the static HTML** so AI crawlers can actually read the site.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 28/100 | 25% | 7.0 |
| Brand Authority | 3/100 | 20% | 0.6 |
| Content E-E-A-T | 28/100 | 20% | 5.6 |
| Technical GEO | 62/100 | 15% | 9.3 |
| Schema & Structured Data | 18/100 | 10% | 1.8 |
| Platform Optimization | 33/100 | 10% | 3.3 |
| **Overall GEO Score** | | | **28/100** |

### Platform Readiness

| AI Platform | Score | Status |
|---|---|---|
| Google AI Overviews | 42/100 | Fair |
| Google Gemini | 35/100 | Poor |
| Bing Copilot | 28/100 | Poor |
| ChatGPT Web Search | 22/100 | Poor |
| Perplexity AI | 18/100 | Critical |

---

## Critical Issues (Fix Immediately)

### 1. Blog Article Bodies NOT Pre-Rendered in Static HTML
**Impact:** All AI crawlers see empty blog pages
**Details:** In `scripts/prerender.mjs`, blog articles are pre-rendered with only title + date + excerpt. The actual `content` field from `blogPosts.ts` is **never injected** into the static HTML. AI crawlers that don't execute JavaScript (GPTBot, PerplexityBot, ClaudeBot) see near-empty pages.
**Fix:** Modify `prerender.mjs` to convert markdown content to HTML and inject it into the `<div id="root">` for each blog article page.

### 2. Zero Brand Presence on the Web
**Impact:** No AI system can recognize or recommend Factumation
**Details:** Searches for "Factumation" return zero results on Google, YouTube, Reddit, LinkedIn, Product Hunt, Capterra, G2, and all directories. The brand does not exist as a recognizable entity for any AI model. Additionally, the name "Factupro" is already claimed by 3+ other entities (factupro.es, GitHub Narutino10/FactuPro, Google Play app).
**Fix:** Commit to "Factumation" name exclusively. Create profiles on LinkedIn, Product Hunt, AlternativeTo.net, GitHub (public repo with README).

### 3. No Organization Schema — Zero Entity Identity
**Impact:** AI models cannot link Factumation to any known entity
**Details:** No Organization schema exists anywhere on the site. No `sameAs` properties linking to any external profiles. The SoftwareApplication schema lacks `url`, `author`, and `creator` links.
**Fix:** Add Organization JSON-LD with `sameAs` array on every page.

### 4. Root URL `/` Serves Empty HTML
**Impact:** Crawlers hitting the root URL see zero content
**Details:** The root URL `https://factumation.vercel.app/` is NOT pre-rendered — it serves `index.html` with an empty `<div id="root"></div>`. The canonical points to `/fr` but the content differs.
**Fix:** Add a server-level redirect from `/` to `/fr` in `vercel.json`, or pre-render the root URL.

### 5. No llms.txt File
**Impact:** AI crawlers have no structured site summary
**Details:** Requesting `/llms.txt` returns the SPA shell (false 200) because Vercel's rewrite catches all paths. No actual llms.txt file exists.
**Fix:** Create `public/llms.txt` and `public/llms-full.txt` describing the site for AI systems.

---

## High Priority Issues

### 6. Content Extremely Thin
- Homepage: ~150 words (competitors have 800-2000+)
- Blog articles: 350-450 words claiming to be "guides complets" (competitors: 1500-3000 words)
- About page: 65 words with zero team/author info
- No source citations, no statistics, no regulatory references (article numbers, law names)
**Fix:** Expand blog articles to 1500+ words with legal source citations (CGI articles, ordonnances, DGFiP references).

### 7. No Human Author Attribution
- All blog posts authored by "Factumation" (brand name, not a person)
- No author bios, no credentials, no expertise signals
- No Person schema anywhere
**Fix:** Add real author names with credentials (e.g., "specialiste en gestion d'entreprise") and Person schema.

### 8. Missing Legal Pages (GDPR Risk)
- No Privacy Policy page
- No Terms of Service / CGU
- For a tool processing business financial data, this is both a compliance risk and a major trust signal failure
**Fix:** Create `/fr/privacy` and `/fr/terms` pages with proper legal content.

### 9. Identical Schema on Every Page
- The same SoftwareApplication + FAQPage schemas are hardcoded in `index.html` and copied to every pre-rendered page
- Blog articles serve SoftwareApplication schema (irrelevant)
- FAQ mixes French and English questions in one block
**Fix:** Remove schemas from `index.html`, generate page-specific schemas in `prerender.mjs`.

### 10. Security Headers Missing
- No Content-Security-Policy
- No X-Frame-Options
- No X-Content-Type-Options
- No Referrer-Policy
**Fix:** Add headers via `vercel.json` configuration.

### 11. Not Verified in Bing Webmaster Tools
- No `msvalidate.01` meta tag
- No IndexNow protocol support
- Site may not be indexed by Bing at all (Bing Copilot and ChatGPT Web Search use Bing index)
**Fix:** Verify in Bing Webmaster Tools, implement IndexNow.

---

## Medium Priority Issues

### 12. FAQ Not Rendered as Visible HTML
- FAQ exists only in JSON-LD structured data, not as visible content on the page
- AI systems extracting from page content (not just schema) miss the FAQ entirely
**Fix:** Render FAQ section as visible HTML on the homepage.

### 13. Blog Headings Not Question-Based
- Current: "Les mentions obligatoires sur une facture"
- Better: "Quelles sont les mentions obligatoires sur une facture ?"
- Question-based headings match AI extraction patterns (especially Google AI Overviews)
**Fix:** Rewrite H2/H3 headings as questions with 40-60 word "answer target" paragraphs.

### 14. Title Tags Too Long
- Homepage: 81 characters (recommendation: 50-60)
- Will be truncated in SERPs
**Fix:** Shorten to ~60 characters.

### 15. robots.txt Invalid Syntax
- `/*.json$` uses regex `$` anchor — not valid in robots.txt (uses glob patterns)
- No AI crawler-specific rules
**Fix:** Fix to `/*.json` and add explicit AI crawler Allow rules.

### 16. No YouTube/Video Presence
- Google Gemini heavily favors content with YouTube presence
- No tutorial videos, no demo content
**Fix:** Create 3-5 short tutorial videos and embed in blog articles.

### 17. importmap Artifact in Production HTML
- `<script type="importmap">` referencing `aistudiocdn.com` is a development artifact
**Fix:** Remove from production `index.html`.

---

## Low Priority Issues

### 18. No Reddit/Forum Presence
- Perplexity AI heavily indexes Reddit — zero mentions is a critical gap for that platform
**Fix:** Post genuinely in r/freelanceFR, r/smallbusiness, r/autoentrepreneur.

### 19. No Wikidata Entry
- Helps ChatGPT, Gemini, and Bing Copilot recognize the entity
**Fix:** Create a Wikidata item (requires some third-party coverage first).

### 20. Missing Preload Hints
- No `<link rel="preload">` for LCP candidate or critical fonts
- No preconnect for Supabase API
**Fix:** Add preload/preconnect hints.

### 21. SPA 404 Handling
- All non-existent URLs return 200 with the base template
- Search engines may index garbage URLs as thin content
**Fix:** Implement proper 404 status codes for unknown routes.

---

## Category Deep Dives

### AI Citability (28/100)

**Critical bug:** Blog article bodies are not in pre-rendered HTML — AI crawlers see only title + excerpt.

| Page | Score | Key Issue |
|---|---|---|
| Homepage `/fr` | 25 | ~150 words, no visible FAQ, all promotional copy |
| About `/fr/about` | 22 | 65 words, zero educational content |
| Blog: Guide complet | 38 | Best page — mandatory invoice elements list is quotable, but only 450 words |
| Blog: E-facture 2026 | 35 | Timeline is extractable (2026/2027/2028) but no law references |

**Strongest citability element:** The "Mentions obligatoires" list (7 mandatory invoice elements for France) — the single most quotable passage on the site.

**Weakest:** No statistics, no source citations, no comparison tables, no definitions. No content answers common user queries like "What must a French invoice contain?" in a self-contained way.

**Rewrite suggestion for homepage — add visible FAQ:**
> **Quelles sont les mentions obligatoires sur une facture en France ?**
> Selon l'article L441-9 du Code de commerce, une facture doit comporter : le nom et l'adresse de l'emetteur et du destinataire, le numero SIRET, un numero de facture unique et sequentiel, la date d'emission, la designation des produits/services, le montant HT, le taux et montant de TVA, le montant TTC, et les conditions de paiement.

---

### Brand Authority (3/100)

**The brand does not exist on the open web.**

| Platform | Status |
|---|---|
| Google Search | NOT FOUND |
| YouTube | NOT FOUND |
| Reddit | NOT FOUND |
| LinkedIn | NOT FOUND |
| Product Hunt | NOT FOUND |
| Trustpilot/G2/Capterra | NOT FOUND |
| French Directories | NOT FOUND |
| GitHub (public) | EXISTS but not indexed |
| Wikipedia/Wikidata | NOT FOUND |
| Any third-party article | NOT FOUND |

**Name collision:** "Factupro" is claimed by factupro.es (Spanish SaaS), Narutino10/FactuPro (GitHub), and a Google Play app. Use "Factumation" exclusively.

**Priority actions:**
1. Commit to "Factumation" as the sole brand name
2. Make GitHub repo public with detailed README
3. Launch on Product Hunt + AlternativeTo.net
4. Create LinkedIn company page
5. Seek 3-5 third-party mentions (guest posts, directory listings)

---

### Content E-E-A-T (28/100)

| Signal | Score | Finding |
|---|---|---|
| Experience | 5/25 | Zero real-world usage evidence, no case studies, no user testimonials |
| Expertise | 8/25 | No author credentials, blog content is surface-level, no technical depth |
| Authoritativeness | 3/25 | Zero backlinks, zero third-party mentions, zero awards |
| Trustworthiness | 12/25 | HTTPS + Vercel hosting, but NO privacy policy, NO terms of service, NO contact details beyond a form |

**About page is 65 words** — positions the product as a "demonstration technique" rather than a professional tool, which undermines credibility.

**Blog articles have zero source citations** — no links to government sites (service-public.fr, legifrance.gouv.fr), no law article numbers, no DGFiP references.

---

### Technical GEO (62/100)

| Component | Score | Status |
|---|---|---|
| Server-Side Rendering | 60 | Pre-rendering exists but outputs thin content |
| Meta Tags & Indexability | 85 | Proper meta tags, hreflang, canonical |
| Crawlability | 65 | robots.txt OK, sitemap good, but SPA fallback issues |
| Security Headers | 40 | Only HTTPS + HSTS, all others missing |
| Core Web Vitals Risk | 55 | ~475 KB JS total, Tailwind CDN removed (good) |
| Mobile Optimization | 80 | Viewport correct, responsive CSS |
| URL Structure | 90 | Clean, descriptive, proper i18n pattern |

**Positive:** Vercel hosting with HSTS, proper hreflang, good URL structure, GTM deferred, async fonts, Tailwind migrated to build-time CSS (36 KB vs 407 KB CDN).

**Negative:** Root URL empty, pre-rendering too thin, no llms.txt, security headers missing, no 404 handling.

---

### Schema & Structured Data (18/100)

| Schema Type | Status | Issue |
|---|---|---|
| SoftwareApplication | Present | Missing `url`, `screenshot`, `author`, `inLanguage` |
| FAQPage | Present | Mixes FR/EN, restricted since Aug 2023 |
| Organization | **MISSING** | Critical — zero entity identity |
| Article/BlogPosting | **MISSING** | No schema on any blog post |
| Person (author) | **MISSING** | No author schema |
| BreadcrumbList | **MISSING** | No navigation context |
| WebSite | **MISSING** | No site-level identity |
| speakable | **MISSING** | No voice/AI assistant markers |
| sameAs | **MISSING** | Zero cross-platform links |

**Architecture problem:** Schemas are hardcoded in `index.html` (lines 79-153) and blindly copied to every page. Blog articles serve SoftwareApplication schema. Fix: generate page-specific schemas in `prerender.mjs`.

---

### Platform Optimization (33/100)

| Platform | Score | Biggest Gap |
|---|---|---|
| Google AI Overviews | 42 | Content too thin, headings not question-based |
| Google Gemini | 35 | Zero Google ecosystem presence (no YouTube, no GBP) |
| Bing Copilot | 28 | Not verified in Bing, no IndexNow |
| ChatGPT Web Search | 22 | No entity recognition, no llms.txt |
| Perplexity AI | 18 | Zero community validation (no Reddit/forums) |

**Cross-platform multiplier fix:** Full pre-rendering of page content impacts ALL 5 platforms simultaneously.

---

## Quick Wins (Implement This Week)

1. **Fix `prerender.mjs` to inject full blog article content into static HTML** — affects all 5 AI platforms, low effort (~2-3h)
2. **Create `public/llms.txt`** describing Factumation for AI crawlers — 1 hour
3. **Add redirect `/` -> `/fr` in `vercel.json`** — 5 minutes
4. **Add security headers in `vercel.json`** (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — 30 minutes
5. **Verify site in Bing Webmaster Tools + submit sitemap** — 30 minutes

---

## 30-Day Action Plan

### Week 1: Technical Foundation
- [ ] Fix `prerender.mjs` to output full page content (blog bodies, features section, visible FAQ)
- [ ] Create `public/llms.txt` and `public/llms-full.txt`
- [ ] Add `/` -> `/fr` redirect in `vercel.json`
- [ ] Add security headers in `vercel.json`
- [ ] Verify in Bing Webmaster Tools, implement IndexNow
- [ ] Fix robots.txt (`/*.json$` -> `/*.json`, add AI crawler rules)
- [ ] Remove `importmap` artifact from production HTML

### Week 2: Schema & Structure
- [ ] Remove hardcoded schemas from `index.html`
- [ ] Add Organization schema with `sameAs` (even to placeholder profiles)
- [ ] Generate page-specific schemas in `prerender.mjs` (BlogPosting, BreadcrumbList, WebSite)
- [ ] Split FAQ schema by language (FR pages get FR questions only)
- [ ] Enhance SoftwareApplication schema (`url`, `screenshot`, `inLanguage`)
- [ ] Add Privacy Policy and Terms of Service pages
- [ ] Shorten title tags to ~60 characters

### Week 3: Content Depth
- [ ] Expand "Guide complet" article from 450 to 1500+ words with legal source citations
- [ ] Expand "Facturation electronique 2026" with law references, PDP list, penalties
- [ ] Rewrite all blog headings as questions with answer-target paragraphs
- [ ] Add visible FAQ section (10+ questions) to homepage HTML
- [ ] Add author bios with credentials to blog posts
- [ ] Create a new "Glossaire de la facturation" page (definitions: facture proforma, avoir, acompte, etc.)

### Week 4: Brand Building
- [ ] Make GitHub repo public with detailed README, screenshots, feature list
- [ ] Create LinkedIn company page with weekly posting plan
- [ ] Launch on Product Hunt (upcoming page now, launch later)
- [ ] List on AlternativeTo.net, SaaSHub, Capterra, G2
- [ ] Post on Reddit (r/freelanceFR, r/smallbusiness, r/SideProject)
- [ ] Write 1 guest post on Medium/Dev.to about building the tool
- [ ] Create 1 YouTube demo video (2 min) and embed in blog

---

## Projected Score After 30-Day Plan

| Category | Current | After 30 Days | Change |
|---|---|---|---|
| AI Citability | 28 | 55-60 | +27-32 |
| Brand Authority | 3 | 20-25 | +17-22 |
| Content E-E-A-T | 28 | 50-55 | +22-27 |
| Technical GEO | 62 | 80-85 | +18-23 |
| Schema & Structured Data | 18 | 65-70 | +47-52 |
| Platform Optimization | 33 | 50-55 | +17-22 |
| **Overall GEO Score** | **28** | **52-58** | **+24-30** |

---

## Appendix: Pages Analyzed

| URL | Title | GEO Issues |
|---|---|---|
| `/` (root) | Factumation - Generateur... | Empty HTML, no pre-rendering |
| `/fr` | Factumation - Generateur... | Thin content (150 words), no visible FAQ |
| `/en` | Factumation - Free Invoice... | Thin content, same issues as /fr |
| `/fr/create` | Creer une facture | Tool page, minimal SEO content |
| `/en/create` | Create an invoice | Tool page, minimal SEO content |
| `/fr/quote` | Creer un devis | Tool page, minimal SEO content |
| `/en/quote` | Create a quote | Tool page, minimal SEO content |
| `/fr/about` | A propos | 65 words, no team info, no credentials |
| `/en/about` | About | Same issues as /fr/about |
| `/fr/contact` | Contact | Form only, no address/phone |
| `/en/contact` | Contact | Same as /fr/contact |
| `/fr/blog` | Blog | No dates, no authors on listing |
| `/en/blog` | Blog | Only 1 EN article |
| `/fr/blog/facturation-en-ligne-gratuit-guide-complet` | Guide complet 2026 | 450 words, no sources, body not pre-rendered |
| `/fr/blog/comment-creer-facture-professionnelle` | Creer une facture pro | Thin, no sources |
| `/fr/blog/facturation-electronique-obligatoire-2026` | E-facture 2026 | 380 words, no law references |
| `/fr/blog/auto-entrepreneur-simplifiez-facturation` | Auto-entrepreneur | Thin, promotional |
| `/en/blog/free-online-invoice-generator-guide` | Free Invoice Guide | EN version, thin |

---

*Generated by GEO Audit — Claude Code | 2026-03-10*
