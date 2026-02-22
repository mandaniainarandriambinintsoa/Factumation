/**
 * Post-build pre-rendering script.
 * Generates static HTML files per route with correct SEO meta tags
 * AND visible body content so that crawlers get real HTML without JS.
 *
 * Usage: node scripts/prerender.mjs
 * Runs automatically after `vite build` via package.json build script.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const BASE_URL = 'https://factumation.vercel.app';

// Load i18n files
const fr = JSON.parse(readFileSync(resolve(ROOT, 'i18n/fr.json'), 'utf-8'));
const en = JSON.parse(readFileSync(resolve(ROOT, 'i18n/en.json'), 'utf-8'));
const translations = { fr, en };

// Blog posts data (mirrored from data/blogPosts.ts)
const blogPosts = [
  {
    slug: 'facturation-en-ligne-gratuit-guide-complet',
    lang: 'fr',
    title: 'Facturation en ligne gratuit : Guide complet 2026',
    excerpt: 'D\u00e9couvrez comment cr\u00e9er des factures professionnelles gratuitement en ligne. Guide complet pour freelances, auto-entrepreneurs et PME.',
    date: '2026-02-15',
  },
  {
    slug: 'comment-creer-facture-professionnelle',
    lang: 'fr',
    title: 'Comment cr\u00e9er une facture professionnelle en ligne',
    excerpt: 'Apprenez \u00e0 cr\u00e9er une facture professionnelle qui respecte toutes les normes l\u00e9gales. Tutoriel pas \u00e0 pas avec notre g\u00e9n\u00e9rateur gratuit.',
    date: '2026-02-10',
  },
  {
    slug: 'facturation-electronique-obligatoire-2026',
    lang: 'fr',
    title: 'Facturation \u00e9lectronique obligatoire 2026 : ce que vous devez savoir',
    excerpt: 'La facturation \u00e9lectronique devient progressivement obligatoire en France. D\u00e9couvrez le calendrier, les obligations et comment vous pr\u00e9parer.',
    date: '2026-02-01',
  },
  {
    slug: 'free-online-invoice-generator-guide',
    lang: 'en',
    title: 'Free Online Invoice Generator: Complete Guide 2026',
    excerpt: 'Learn how to create professional invoices for free online. Complete guide for freelancers, self-employed, and small businesses.',
    date: '2026-02-12',
  },
  {
    slug: 'auto-entrepreneur-simplifiez-facturation',
    lang: 'fr',
    title: 'Auto-entrepreneur : simplifiez votre facturation',
    excerpt: 'Guide complet pour les auto-entrepreneurs qui veulent simplifier leur facturation. Mentions obligatoires, outils gratuits et bonnes pratiques.',
    date: '2026-01-28',
  },
];

// Routes to pre-render (public pages only)
const routes = [
  { path: '',        seoTitle: 'seo.homeTitle',       seoDesc: 'seo.homeDescription' },
  { path: '/create', seoTitle: 'seo.invoiceTitle',    seoDesc: 'seo.invoiceDescription' },
  { path: '/quote',  seoTitle: 'seo.quoteTitle',      seoDesc: 'seo.quoteDescription' },
  { path: '/about',  seoTitle: 'seo.aboutTitle',      seoDesc: 'seo.aboutDescription' },
  { path: '/contact',seoTitle: 'seo.contactTitle',    seoDesc: 'seo.contactDescription' },
  { path: '/blog',   seoTitle: 'seo.blogTitle',       seoDesc: 'seo.blogDescription' },
];

const langs = ['fr', 'en'];

function getTranslation(lang, key) {
  const parts = key.split('.');
  let value = translations[lang];
  for (const part of parts) {
    value = value?.[part];
  }
  return value || key;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Convert basic markdown to HTML (headings, bold, lists, paragraphs).
 */
function markdownToHtml(md) {
  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Close open lists if line is not a list item
    if (!trimmed.match(/^[-*] /) && inUl) { html += '</ul>'; inUl = false; }
    if (!trimmed.match(/^\d+\. /) && inOl) { html += '</ol>'; inOl = false; }

    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith('### ')) {
      html += `<h3>${inlineMd(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2>${inlineMd(trimmed.slice(3))}</h2>`;
    }
    // Unordered list
    else if (trimmed.match(/^[-*] /)) {
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${inlineMd(trimmed.slice(2))}</li>`;
    }
    // Ordered list
    else if (trimmed.match(/^\d+\. /)) {
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${inlineMd(trimmed.replace(/^\d+\. /, ''))}</li>`;
    }
    // Paragraph
    else {
      html += `<p>${inlineMd(trimmed)}</p>`;
    }
  }

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';
  return html;
}

function inlineMd(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Generate visible body content for a given route and language.
 * This content sits inside <div id="root"> and gets replaced by React on hydration.
 */
function generateBodyContent(lang, routePath) {
  const t = translations[lang];
  const otherLang = lang === 'fr' ? 'en' : 'fr';

  if (routePath === '') {
    // Homepage
    return `<main>
      <h1>${escapeHtml(t.hero.title)} ${escapeHtml(t.hero.titleHighlight)}</h1>
      <p>${escapeHtml(t.hero.subtitle)}</p>
      <p>${escapeHtml(t.hero.free)} - ${escapeHtml(t.hero.noCard)}</p>
      <nav>
        <a href="/${lang}/create">${escapeHtml(t.hero.createInvoice)}</a>
        <a href="/${lang}/quote">${escapeHtml(t.hero.createQuote)}</a>
        <a href="/${lang}/blog">${escapeHtml(t.nav?.blog || 'Blog')}</a>
      </nav>
    </main>`;
  }

  if (routePath === '/create') {
    return `<main>
      <h1>${escapeHtml(getTranslation(lang, 'seo.invoiceTitle'))}</h1>
      <p>${escapeHtml(getTranslation(lang, 'seo.invoiceDescription'))}</p>
    </main>`;
  }

  if (routePath === '/quote') {
    return `<main>
      <h1>${escapeHtml(getTranslation(lang, 'seo.quoteTitle'))}</h1>
      <p>${escapeHtml(getTranslation(lang, 'seo.quoteDescription'))}</p>
    </main>`;
  }

  if (routePath === '/about') {
    return `<main>
      <h1>${escapeHtml(t.about.title)}</h1>
      <p>${escapeHtml(t.about.subtitle)}</p>
      <ul>
        <li>${escapeHtml(t.about.feature1)}</li>
        <li>${escapeHtml(t.about.feature2)}</li>
        <li>${escapeHtml(t.about.feature3)}</li>
        <li>${escapeHtml(t.about.feature4)}</li>
      </ul>
    </main>`;
  }

  if (routePath === '/contact') {
    return `<main>
      <h1>${escapeHtml(getTranslation(lang, 'seo.contactTitle'))}</h1>
      <p>${escapeHtml(getTranslation(lang, 'seo.contactDescription'))}</p>
    </main>`;
  }

  if (routePath === '/blog') {
    const posts = blogPosts.filter(p => p.lang === lang);
    const listItems = posts.map(p =>
      `<li><a href="/${lang}/blog/${p.slug}">${escapeHtml(p.title)}</a><p>${escapeHtml(p.excerpt)}</p></li>`
    ).join('');
    return `<main>
      <h1>${escapeHtml(getTranslation(lang, 'seo.blogTitle'))}</h1>
      <p>${escapeHtml(getTranslation(lang, 'seo.blogDescription'))}</p>
      <ul>${listItems}</ul>
    </main>`;
  }

  return '';
}

/**
 * Replace SEO meta tags in the HTML template for a given route.
 */
function replaceSeoTags(html, { lang, title, description, canonicalUrl, alternateFr, alternateEn, ogLocale, ogLocaleAlt }) {
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonicalUrl}"`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="fr" href="[^"]*"/,
    `<link rel="alternate" hreflang="fr" href="${alternateFr}"`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="en" href="[^"]*"/,
    `<link rel="alternate" hreflang="en" href="${alternateEn}"`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"/,
    `<link rel="alternate" hreflang="x-default" href="${alternateFr}"`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${canonicalUrl}"`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeHtml(title)}"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeHtml(description)}"`
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"/,
    `<meta property="og:locale" content="${ogLocale}"`
  );
  html = html.replace(
    /<meta property="og:locale:alternate" content="[^"]*"/,
    `<meta property="og:locale:alternate" content="${ogLocaleAlt}"`
  );
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"/,
    `<meta name="twitter:url" content="${canonicalUrl}"`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeHtml(title)}"`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeHtml(description)}"`
  );
  return html;
}

/**
 * Inject visible content inside <div id="root">.
 * React will replace this on mount.
 */
function injectBodyContent(html, content) {
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

// Read the base template
const template = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

let filesGenerated = 0;

// --- Pre-render standard routes ---
for (const lang of langs) {
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const ogLocale = lang === 'fr' ? 'fr_FR' : 'en_US';
  const ogLocaleAlt = lang === 'fr' ? 'en_US' : 'fr_FR';

  for (const route of routes) {
    const title = getTranslation(lang, route.seoTitle);
    const description = getTranslation(lang, route.seoDesc);
    const canonicalPath = `/${lang}${route.path}`;
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    const alternateFr = `${BASE_URL}/fr${route.path}`;
    const alternateEn = `${BASE_URL}/en${route.path}`;

    let html = replaceSeoTags(template, {
      lang, title, description, canonicalUrl, alternateFr, alternateEn, ogLocale, ogLocaleAlt,
    });

    // Inject visible body content
    const bodyContent = generateBodyContent(lang, route.path);
    if (bodyContent) {
      html = injectBodyContent(html, bodyContent);
    }

    const outDir = route.path
      ? resolve(DIST, lang, route.path.slice(1))
      : resolve(DIST, lang);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
    filesGenerated++;
  }
}

// --- Pre-render blog articles ---
for (const post of blogPosts) {
  const lang = post.lang;
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const ogLocale = lang === 'fr' ? 'fr_FR' : 'en_US';
  const ogLocaleAlt = lang === 'fr' ? 'en_US' : 'fr_FR';

  const canonicalUrl = `${BASE_URL}/${lang}/blog/${post.slug}`;
  const alternateFr = lang === 'fr' ? canonicalUrl : `${BASE_URL}/fr/blog/${post.slug}`;
  const alternateEn = lang === 'en' ? canonicalUrl : `${BASE_URL}/en/blog/${post.slug}`;

  let html = replaceSeoTags(template, {
    lang,
    title: `${post.title} - Factumation`,
    description: post.excerpt,
    canonicalUrl,
    alternateFr,
    alternateEn,
    ogLocale,
    ogLocaleAlt,
  });

  // Inject article content
  const articleContent = `<main><article>
    <h1>${escapeHtml(post.title)}</h1>
    <p><time datetime="${post.date}">${post.date}</time></p>
    <p>${escapeHtml(post.excerpt)}</p>
    <a href="/${lang}/blog">${lang === 'fr' ? 'Retour au blog' : 'Back to blog'}</a>
  </article></main>`;

  html = injectBodyContent(html, articleContent);

  const outDir = resolve(DIST, lang, 'blog', post.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
  filesGenerated++;
}

console.log(`[prerender] Generated ${filesGenerated} static HTML files (${routes.length * langs.length} pages + ${blogPosts.length} blog articles).`);
