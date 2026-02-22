/**
 * Post-build pre-rendering script.
 * Generates static HTML files per route with correct SEO meta tags
 * so that Googlebot gets proper <title>, <meta description>, <canonical>, <hreflang>
 * without needing to execute JavaScript.
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

// Read the base template
const template = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

let filesGenerated = 0;

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

    let html = template;

    // Replace <html lang="...">
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

    // Replace <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

    // Replace meta description
    html = html.replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${escapeHtml(description)}"`
    );

    // Replace canonical
    html = html.replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${canonicalUrl}"`
    );

    // Replace hreflang links
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

    // Replace OG tags
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

    // Replace Twitter tags
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

    // Write the file
    const outDir = route.path
      ? resolve(DIST, lang, route.path.slice(1))
      : resolve(DIST, lang);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
    filesGenerated++;
  }
}

console.log(`[prerender] Generated ${filesGenerated} static HTML files.`);
