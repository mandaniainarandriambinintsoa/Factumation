/**
 * Post-build pre-rendering script.
 * Generates static HTML files per route with correct SEO meta tags,
 * page-specific Schema.org JSON-LD, and FULL visible body content
 * so that crawlers get real HTML without JS.
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
    readTime: 8,
    keywords: ['facturation en ligne gratuit', 'logiciel facturation gratuit', 'facture en ligne'],
    content: `## Pourquoi utiliser un logiciel de facturation en ligne gratuit ?

La facturation est une obligation l\u00e9gale pour tout professionnel. Que vous soyez freelance, auto-entrepreneur ou dirigeant de PME, vous devez \u00e9mettre des factures conformes \u00e0 la r\u00e9glementation. Un logiciel de facturation en ligne gratuit vous permet de :

- **Gagner du temps** : plus besoin de cr\u00e9er vos factures manuellement sur Word ou Excel
- **\u00catre conforme** : toutes les mentions obligatoires sont automatiquement incluses
- **Rester professionnel** : des mod\u00e8les \u00e9l\u00e9gants qui inspirent confiance \u00e0 vos clients
- **\u00c9conomiser** : pas besoin de payer un abonnement mensuel co\u00fbteux

## Les mentions obligatoires sur une facture

En France et dans la plupart des pays francophones, une facture doit comporter :

1. **Identit\u00e9 de l'\u00e9metteur** : nom, adresse, SIRET (France) ou NIF/STAT (Madagascar)
2. **Identit\u00e9 du client** : nom ou raison sociale, adresse
3. **Num\u00e9ro de facture** : num\u00e9rotation s\u00e9quentielle unique
4. **Date d'\u00e9mission** et date d'\u00e9ch\u00e9ance
5. **D\u00e9tail des prestations** : description, quantit\u00e9, prix unitaire
6. **Montant total** : HT, TVA (si applicable), TTC
7. **Conditions de paiement** : mode de paiement, d\u00e9lai

## Comment cr\u00e9er une facture gratuitement avec Factumation

Factumation est un g\u00e9n\u00e9rateur de factures 100% gratuit qui vous permet de cr\u00e9er des factures professionnelles en quelques clics :

### \u00c9tape 1 : Renseignez vos informations
Entrez le nom de votre entreprise, votre adresse et vos coordonn\u00e9es. Si vous avez un compte, ces informations sont pr\u00e9-remplies automatiquement.

### \u00c9tape 2 : Ajoutez les informations du client
Saisissez les coordonn\u00e9es de votre client. Avec un compte gratuit, vous pouvez sauvegarder vos clients pour les r\u00e9utiliser.

### \u00c9tape 3 : D\u00e9taillez vos prestations
Ajoutez les lignes de facturation avec la description, la quantit\u00e9 et le prix unitaire. Le total est calcul\u00e9 automatiquement.

### \u00c9tape 4 : Exportez en PDF
Pr\u00e9visualisez votre facture et t\u00e9l\u00e9chargez-la au format PDF. Vous pouvez aussi l'envoyer directement par email.

## Multi-devises : EUR, USD, MGA et plus

Factumation supporte plusieurs devises dont l'Euro, le Dollar US, la Livre Sterling, le Dollar Canadien, le Franc Suisse et l'Ariary Malgache. Id\u00e9al pour les professionnels qui travaillent \u00e0 l'international.

## Conclusion

La facturation en ligne gratuit n'a jamais \u00e9t\u00e9 aussi simple. Avec Factumation, cr\u00e9ez vos factures professionnelles en quelques secondes, sans inscription obligatoire et sans frais cach\u00e9s.`,
  },
  {
    slug: 'comment-creer-facture-professionnelle',
    lang: 'fr',
    title: 'Comment cr\u00e9er une facture professionnelle en ligne',
    excerpt: 'Apprenez \u00e0 cr\u00e9er une facture professionnelle qui respecte toutes les normes l\u00e9gales. Tutoriel pas \u00e0 pas avec notre g\u00e9n\u00e9rateur gratuit.',
    date: '2026-02-10',
    readTime: 6,
    keywords: ['g\u00e9n\u00e9rateur facture en ligne', 'cr\u00e9er facture professionnelle', 'mod\u00e8le facture'],
    content: `## L'importance d'une facture professionnelle

Une facture professionnelle est bien plus qu'un simple document comptable. C'est la carte de visite de votre entreprise aupr\u00e8s de vos clients. Une facture soign\u00e9e et compl\u00e8te :

- Renforce votre **cr\u00e9dibilit\u00e9** professionnelle
- Facilite le **paiement rapide** de vos prestations
- Assure votre **conformit\u00e9** avec la r\u00e9glementation
- Simplifie votre **comptabilit\u00e9** et vos d\u00e9clarations fiscales

## Les \u00e9l\u00e9ments d'une facture professionnelle r\u00e9ussie

### 1. Un en-t\u00eate clair
Votre logo, le nom de votre entreprise et vos coordonn\u00e9es compl\u00e8tes doivent \u00eatre visibles imm\u00e9diatement. C'est la premi\u00e8re chose que voit votre client.

### 2. Les informations fiscales
Selon votre r\u00e9gion, incluez :
- **France/Europe** : SIRET et num\u00e9ro de TVA intracommunautaire
- **Madagascar** : NIF et num\u00e9ro STAT

### 3. Une num\u00e9rotation coh\u00e9rente
Utilisez un syst\u00e8me de num\u00e9rotation s\u00e9quentielle (ex: INV-2026-001, INV-2026-002). Ne sautez jamais de num\u00e9ro et ne r\u00e9utilisez jamais un num\u00e9ro d\u00e9j\u00e0 attribu\u00e9.

### 4. Un d\u00e9tail pr\u00e9cis des prestations
Chaque ligne doit comporter :
- Une description claire de la prestation ou du produit
- La quantit\u00e9
- Le prix unitaire
- Le montant total de la ligne

### 5. Les conditions de paiement
Pr\u00e9cisez clairement :
- Le mode de paiement accept\u00e9 (virement, carte, PayPal, etc.)
- La date d'\u00e9ch\u00e9ance
- Vos coordonn\u00e9es bancaires si n\u00e9cessaire (IBAN/BIC)

## Cr\u00e9er votre premi\u00e8re facture avec Factumation

Avec Factumation, cr\u00e9er une facture professionnelle prend moins de 2 minutes :

1. Rendez-vous sur la page **Cr\u00e9er une facture**
2. Remplissez les informations de votre entreprise
3. Ajoutez les coordonn\u00e9es de votre client
4. D\u00e9taillez vos prestations ligne par ligne
5. Choisissez votre devise et mode de paiement
6. Pr\u00e9visualisez et t\u00e9l\u00e9chargez votre PDF

## Astuce : Gagnez du temps avec un compte gratuit

En cr\u00e9ant un compte gratuit sur Factumation, vous pouvez :
- Sauvegarder plusieurs soci\u00e9t\u00e9s \u00e9mettrices
- Constituer un carnet de clients r\u00e9utilisable
- Consulter l'historique de vos factures et devis
- Envoyer vos documents directement par email`,
  },
  {
    slug: 'facturation-electronique-obligatoire-2026',
    lang: 'fr',
    title: 'Facturation \u00e9lectronique obligatoire 2026 : ce que vous devez savoir',
    excerpt: 'La facturation \u00e9lectronique devient progressivement obligatoire en France. D\u00e9couvrez le calendrier, les obligations et comment vous pr\u00e9parer.',
    date: '2026-02-01',
    readTime: 7,
    keywords: ['facturation \u00e9lectronique 2026', 'facture \u00e9lectronique obligatoire', 'e-invoicing France'],
    content: `## La r\u00e9forme de la facturation \u00e9lectronique en France

La France s'engage dans une transformation majeure de la facturation entre entreprises. La facturation \u00e9lectronique (e-invoicing) et la transmission des donn\u00e9es de transaction (e-reporting) deviennent progressivement obligatoires.

## Le calendrier de mise en place

### Obligation de r\u00e9ception
Depuis le 1er septembre 2026, toutes les entreprises assujetties \u00e0 la TVA doivent \u00eatre en mesure de **recevoir** des factures \u00e9lectroniques.

### Obligation d'\u00e9mission
L'obligation d'\u00e9mettre des factures \u00e9lectroniques s'applique progressivement :
- **Grandes entreprises** : depuis septembre 2026
- **ETI** (Entreprises de Taille Interm\u00e9diaire) : \u00e0 partir de 2027
- **PME et micro-entreprises** : \u00e0 partir de 2028

## Qu'est-ce qu'une facture \u00e9lectronique conforme ?

Une facture \u00e9lectronique n'est pas simplement un PDF envoy\u00e9 par email. Elle doit :

1. \u00catre \u00e9mise et transmise sous forme **d\u00e9mat\u00e9rialis\u00e9e structur\u00e9e** (format Factur-X, UBL, CII)
2. Transiter par une **Plateforme de D\u00e9mat\u00e9rialisation Partenaire** (PDP) ou le portail public Chorus Pro
3. Contenir des **donn\u00e9es structur\u00e9es** exploitables automatiquement

## Comment se pr\u00e9parer ?

### Pour les auto-entrepreneurs et TPE
- Commencez d\u00e8s maintenant \u00e0 utiliser un logiciel de facturation num\u00e9rique
- Familiarisez-vous avec les formats de facture \u00e9lectronique
- Identifiez la plateforme que vous utiliserez

### Pour les PME
- Auditez vos processus de facturation actuels
- Formez vos \u00e9quipes aux nouveaux outils
- Testez les solutions de facturation \u00e9lectronique disponibles

## Factumation et la facturation \u00e9lectronique

Factumation vous aide \u00e0 prendre de bonnes habitudes d\u00e8s maintenant :
- Cr\u00e9ation de factures conformes aux normes fran\u00e7aises
- Num\u00e9rotation s\u00e9quentielle automatique
- Informations fiscales compl\u00e8tes (SIRET, TVA)
- Export PDF professionnel

En utilisant Factumation aujourd'hui, vous pr\u00e9parez la transition vers la facturation \u00e9lectronique obligatoire de demain.

## Conclusion

La facturation \u00e9lectronique est une opportunit\u00e9 de moderniser vos processus. Commencez d\u00e8s maintenant \u00e0 digitaliser votre facturation pour \u00eatre pr\u00eat le jour J.`,
  },
  {
    slug: 'free-online-invoice-generator-guide',
    lang: 'en',
    title: 'Free Online Invoice Generator: Complete Guide 2026',
    excerpt: 'Learn how to create professional invoices for free online. Complete guide for freelancers, self-employed, and small businesses.',
    date: '2026-02-12',
    readTime: 7,
    keywords: ['free online invoice generator', 'free invoice maker', 'invoice generator PDF'],
    content: `## Why Use a Free Online Invoice Generator?

Creating professional invoices is essential for any business. Whether you're a freelancer, self-employed, or running a small business, you need to send invoices that look professional and comply with regulations. A free online invoice generator helps you:

- **Save time**: No more manually creating invoices in Word or Excel
- **Look professional**: Elegant templates that build trust with clients
- **Stay organized**: Automatic numbering and date tracking
- **Save money**: No expensive monthly subscriptions required

## What Should a Professional Invoice Include?

A professional invoice should contain these essential elements:

1. **Your business information**: Company name, address, tax ID
2. **Client information**: Name or company name, address
3. **Invoice number**: Unique sequential numbering
4. **Dates**: Issue date and payment due date
5. **Line items**: Description, quantity, unit price for each service/product
6. **Totals**: Subtotal, tax (if applicable), grand total
7. **Payment terms**: Accepted payment methods, bank details

## How to Create a Free Invoice with Factumation

Factumation is a 100% free invoice generator that lets you create professional invoices in just a few clicks:

### Step 1: Enter Your Business Details
Fill in your company name, address, and contact information. If you have an account, this information is automatically pre-filled.

### Step 2: Add Client Information
Enter your client's details. With a free account, you can save clients for reuse on future invoices.

### Step 3: Add Line Items
Add your services or products with descriptions, quantities, and unit prices. Totals are calculated automatically.

### Step 4: Export as PDF
Preview your invoice and download it as a professional PDF. You can also send it directly by email.

## Multi-Currency Support

Factumation supports multiple currencies including EUR, USD, GBP, CAD, CHF, and MGA. Perfect for professionals working with international clients.

## Free Account Benefits

Creating a free Factumation account unlocks:
- **Client directory**: Save and reuse client information
- **Multiple companies**: Manage different business entities
- **Invoice history**: Access all your past invoices and quotes
- **Email sending**: Send invoices directly with PDF attachment

## Conclusion

Creating professional invoices has never been easier or more affordable. With Factumation, generate beautiful invoices in seconds, for free, with no hidden costs.`,
  },
  {
    slug: 'auto-entrepreneur-simplifiez-facturation',
    lang: 'fr',
    title: 'Auto-entrepreneur : simplifiez votre facturation',
    excerpt: 'Guide complet pour les auto-entrepreneurs qui veulent simplifier leur facturation. Mentions obligatoires, outils gratuits et bonnes pratiques.',
    date: '2026-01-28',
    readTime: 6,
    keywords: ['facture auto-entrepreneur gratuit', 'facturation auto-entrepreneur', 'micro-entreprise facture'],
    content: `## La facturation pour les auto-entrepreneurs

En tant qu'auto-entrepreneur (micro-entrepreneur), vous \u00eates tenu d'\u00e9mettre des factures pour toutes vos prestations professionnelles. Mais pas de panique : la facturation en micro-entreprise est simplifi\u00e9e par rapport aux autres statuts.

## Les mentions obligatoires pour un auto-entrepreneur

Votre facture doit obligatoirement mentionner :

### Informations sur vous
- Nom et pr\u00e9nom (ou nom commercial)
- Adresse de l'entreprise
- Num\u00e9ro SIRET
- Mention **"TVA non applicable, art. 293 B du CGI"** (si vous \u00eates en franchise de TVA)

### Informations sur le client
- Nom ou raison sociale
- Adresse

### Informations sur la prestation
- Num\u00e9ro de facture (s\u00e9quentiel)
- Date d'\u00e9mission
- Description d\u00e9taill\u00e9e de la prestation
- Quantit\u00e9 et prix unitaire
- Montant total

## Les erreurs fr\u00e9quentes \u00e0 \u00e9viter

### 1. Oublier la mention TVA
Si vous \u00eates en franchise de TVA (chiffre d'affaires sous le seuil), vous devez imp\u00e9rativement indiquer : "TVA non applicable, art. 293 B du CGI".

### 2. Num\u00e9rotation non s\u00e9quentielle
Vos factures doivent suivre un ordre chronologique sans interruption. Utilisez un format clair comme : 2026-001, 2026-002, etc.

### 3. Factures non conserv\u00e9es
Vous devez conserver vos factures pendant **10 ans**. Un outil num\u00e9rique comme Factumation vous aide \u00e0 garder un historique accessible.

## Simplifiez-vous la vie avec Factumation

Factumation est l'outil id\u00e9al pour les auto-entrepreneurs :

- **Gratuit** : pas de frais cach\u00e9s, pas d'abonnement
- **Rapide** : cr\u00e9ez une facture en moins de 2 minutes
- **Conforme** : toutes les mentions obligatoires sont g\u00e9r\u00e9es
- **Pratique** : export PDF, envoi par email, historique

### Fonctionnalit\u00e9s utiles
- Pr\u00e9-remplissage automatique de vos informations
- Carnet de clients pour retrouver facilement vos contacts
- Gestion multi-devises (EUR, USD, etc.)
- Num\u00e9rotation automatique s\u00e9quentielle

## Conseils pratiques

1. **Facturez rapidement** : \u00e9mettez votre facture d\u00e8s la fin de la prestation
2. **Archivez syst\u00e9matiquement** : sauvegardez chaque facture dans votre historique
3. **Relancez poliment** : en cas de retard de paiement, relancez par email
4. **Suivez votre chiffre d'affaires** : gardez un \u0153il sur vos seuils de franchise

## Conclusion

La facturation ne doit pas \u00eatre une corv\u00e9e. Avec les bons outils et les bonnes habitudes, vous pouvez g\u00e9rer votre facturation d'auto-entrepreneur efficacement et gratuitement.`,
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

function escapeJsonLd(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
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

// =============================================
// SCHEMA GENERATION
// =============================================

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Factumation",
    "url": BASE_URL,
    "logo": `${BASE_URL}/og-image.png`,
    "description": "Generateur de factures et devis gratuit en ligne pour freelances, auto-entrepreneurs et PME en France, Madagascar et Afrique francophone.",
    "sameAs": [
      "https://github.com/mandaniainarandriambinintsoa/Factumation"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "availableLanguage": ["French", "English"]
    },
    "areaServed": [
      { "@type": "Country", "name": "France" },
      { "@type": "Country", "name": "Madagascar" }
    ]
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Factumation",
    "url": BASE_URL,
    "inLanguage": ["fr", "en"],
    "description": "Generateur de factures et devis gratuit en ligne",
    "publisher": {
      "@type": "Organization",
      "name": "Factumation",
      "url": BASE_URL
    }
  };
}

function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Factumation",
    "url": BASE_URL,
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Invoice Generator",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    },
    "description": "Generateur de factures et devis gratuit en ligne pour freelances, auto-entrepreneurs et PME en France, Madagascar et Afrique francophone. Export PDF, multi-devises (EUR, MGA, USD), conforme SIRET/NIF.",
    "featureList": [
      "Creation de factures professionnelles",
      "Creation de devis",
      "Export PDF",
      "Multi-devises (EUR, USD, MGA, GBP, CAD, CHF)",
      "Gestion clients",
      "Envoi par email",
      "Conforme SIRET/TVA/NIF"
    ],
    "screenshot": `${BASE_URL}/og-image.png`,
    "inLanguage": ["fr", "en"],
    "creator": {
      "@type": "Organization",
      "name": "Factumation"
    }
  };
}

function faqSchema(lang) {
  const faqFr = [
    {
      "@type": "Question",
      "name": "Factumation est-il vraiment gratuit ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui, Factumation est 100% gratuit. Vous pouvez creer des factures et devis professionnels, les exporter en PDF et les envoyer par email sans aucun frais."
      }
    },
    {
      "@type": "Question",
      "name": "Faut-il creer un compte pour utiliser Factumation ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Non, vous pouvez creer et telecharger des factures et devis sans inscription. Un compte gratuit est necessaire uniquement pour sauvegarder votre historique, gerer vos clients et envoyer par email."
      }
    },
    {
      "@type": "Question",
      "name": "Quelles devises sont supportees ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Factumation supporte l'Euro (EUR), le Dollar US (USD), la Livre Sterling (GBP), le Dollar Canadien (CAD), le Franc Suisse (CHF) et l'Ariary Malgache (MGA)."
      }
    }
  ];

  const faqEn = [
    {
      "@type": "Question",
      "name": "Is Factumation really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Factumation is 100% free. You can create professional invoices and quotes, export them as PDF, and send them by email at no cost."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to create an account to use Factumation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, you can create and download invoices and quotes without signing up. A free account is only needed to save your history, manage clients, and send by email."
      }
    },
    {
      "@type": "Question",
      "name": "What currencies are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Factumation supports the Euro (EUR), US Dollar (USD), British Pound (GBP), Canadian Dollar (CAD), Swiss Franc (CHF), and Malagasy Ariary (MGA)."
      }
    }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": lang === 'fr' ? faqFr : faqEn
  };
}

function breadcrumbSchema(lang, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

function blogPostingSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": "Factumation",
      "url": BASE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Factumation",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/og-image.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/${post.lang}/blog/${post.slug}`
    },
    "inLanguage": post.lang,
    "keywords": post.keywords.join(', '),
    "image": `${BASE_URL}/og-image.png`,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["article h1", "article > p:first-of-type"]
    }
  };
}

/**
 * Generate all JSON-LD schema blocks for a given page.
 */
function generateSchemas(lang, routePath, postData) {
  const schemas = [organizationSchema()];
  const homeName = lang === 'fr' ? 'Accueil' : 'Home';

  if (routePath === '') {
    // Homepage: Organization + WebSite + SoftwareApplication + FAQ
    schemas.push(websiteSchema());
    schemas.push(softwareApplicationSchema());
    schemas.push(faqSchema(lang));
  } else if (routePath === '/blog' && !postData) {
    // Blog listing
    schemas.push(breadcrumbSchema(lang, [
      { name: homeName, url: `${BASE_URL}/${lang}` },
      { name: 'Blog', url: `${BASE_URL}/${lang}/blog` }
    ]));
  } else if (postData) {
    // Blog article
    schemas.push(blogPostingSchema(postData));
    schemas.push(breadcrumbSchema(lang, [
      { name: homeName, url: `${BASE_URL}/${lang}` },
      { name: 'Blog', url: `${BASE_URL}/${lang}/blog` },
      { name: postData.title, url: `${BASE_URL}/${lang}/blog/${postData.slug}` }
    ]));
  } else {
    // Other pages: breadcrumb only
    const pageNames = {
      '/create': lang === 'fr' ? 'Creer une facture' : 'Create an invoice',
      '/quote': lang === 'fr' ? 'Creer un devis' : 'Create a quote',
      '/about': lang === 'fr' ? 'A propos' : 'About',
      '/contact': 'Contact',
    };
    schemas.push(breadcrumbSchema(lang, [
      { name: homeName, url: `${BASE_URL}/${lang}` },
      { name: pageNames[routePath] || routePath, url: `${BASE_URL}/${lang}${routePath}` }
    ]));
  }

  return schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n    ');
}

// =============================================
// BODY CONTENT GENERATION
// =============================================

/**
 * Generate visible body content for a given route and language.
 * This content sits inside <div id="root"> and gets replaced by React on hydration.
 */
function generateBodyContent(lang, routePath) {
  const t = translations[lang];
  const otherLang = lang === 'fr' ? 'en' : 'fr';

  if (routePath === '') {
    // Homepage — include FAQ as visible HTML
    const faqHtml = lang === 'fr' ? `
      <section>
        <h2>Questions fr\u00e9quentes</h2>
        <dl>
          <dt>Factumation est-il vraiment gratuit ?</dt>
          <dd>Oui, Factumation est 100% gratuit. Vous pouvez cr\u00e9er des factures et devis professionnels, les exporter en PDF et les envoyer par email sans aucun frais.</dd>
          <dt>Faut-il cr\u00e9er un compte pour utiliser Factumation ?</dt>
          <dd>Non, vous pouvez cr\u00e9er et t\u00e9l\u00e9charger des factures et devis sans inscription. Un compte gratuit est n\u00e9cessaire uniquement pour sauvegarder votre historique, g\u00e9rer vos clients et envoyer par email.</dd>
          <dt>Quelles devises sont support\u00e9es ?</dt>
          <dd>Factumation supporte l'Euro (EUR), le Dollar US (USD), la Livre Sterling (GBP), le Dollar Canadien (CAD), le Franc Suisse (CHF) et l'Ariary Malgache (MGA).</dd>
        </dl>
      </section>` : `
      <section>
        <h2>Frequently Asked Questions</h2>
        <dl>
          <dt>Is Factumation really free?</dt>
          <dd>Yes, Factumation is 100% free. You can create professional invoices and quotes, export them as PDF, and send them by email at no cost.</dd>
          <dt>Do I need to create an account?</dt>
          <dd>No, you can create and download invoices and quotes without signing up. A free account is only needed to save your history, manage clients, and send by email.</dd>
          <dt>What currencies are supported?</dt>
          <dd>Factumation supports the Euro (EUR), US Dollar (USD), British Pound (GBP), Canadian Dollar (CAD), Swiss Franc (CHF), and Malagasy Ariary (MGA).</dd>
        </dl>
      </section>`;

    return `<main>
      <h1>${escapeHtml(t.hero.title)} ${escapeHtml(t.hero.titleHighlight)}</h1>
      <p>${escapeHtml(t.hero.subtitle)}</p>
      <p>${escapeHtml(t.hero.free)} - ${escapeHtml(t.hero.noCard)}</p>
      <nav>
        <a href="/${lang}/create">${escapeHtml(t.hero.createInvoice)}</a>
        <a href="/${lang}/quote">${escapeHtml(t.hero.createQuote)}</a>
        <a href="/${lang}/blog">${escapeHtml(t.nav?.blog || 'Blog')}</a>
      </nav>${faqHtml}
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
      `<li><a href="/${lang}/blog/${p.slug}">${escapeHtml(p.title)}</a><p>${escapeHtml(p.excerpt)}</p><time datetime="${p.date}">${p.date}</time></li>`
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
 * Generate blog article body with FULL markdown content converted to HTML.
 */
function generateBlogArticleContent(post) {
  const contentHtml = markdownToHtml(post.content);
  const backLabel = post.lang === 'fr' ? 'Retour au blog' : 'Back to blog';

  return `<main><article>
    <h1>${escapeHtml(post.title)}</h1>
    <p><time datetime="${post.date}">${post.date}</time> · ${post.readTime} min read</p>
    <p><em>${escapeHtml(post.excerpt)}</em></p>
    ${contentHtml}
    <a href="/${post.lang}/blog">${backLabel}</a>
  </article></main>`;
}

// =============================================
// SEO TAG REPLACEMENT
// =============================================

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

/**
 * Inject JSON-LD schemas into <head> before the closing comment placeholder.
 */
function injectSchemas(html, schemasHtml) {
  return html.replace(
    '<!-- Schema.org JSON-LD injected per-page by prerender.mjs -->',
    schemasHtml
  );
}

// =============================================
// MAIN BUILD
// =============================================

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

    // Inject page-specific schemas
    const schemasHtml = generateSchemas(lang, route.path, null);
    html = injectSchemas(html, schemasHtml);

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

  // Inject FULL article content (markdown -> HTML)
  const articleContent = generateBlogArticleContent(post);
  html = injectBodyContent(html, articleContent);

  // Inject blog-specific schemas
  const schemasHtml = generateSchemas(lang, '/blog/' + post.slug, post);
  html = injectSchemas(html, schemasHtml);

  const outDir = resolve(DIST, lang, 'blog', post.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
  filesGenerated++;
}

console.log(`[prerender] Generated ${filesGenerated} static HTML files (${routes.length * langs.length} pages + ${blogPosts.length} blog articles).`);
console.log(`[prerender] Schemas: Organization + page-specific (WebSite, SoftwareApplication, FAQ, BlogPosting, BreadcrumbList)`);
