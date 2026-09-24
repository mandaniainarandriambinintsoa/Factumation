import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle,
  FileText,
  Globe,
  Mic,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BrandMark } from '@/components/brand-mark';
import { getSiteUrl } from '@/lib/env';

const copy = {
  fr: {
    home: 'Accueil',
    invoice: 'Facture',
    quote: 'Devis',
    pricing: 'Tarifs',
    about: 'À propos',
    contact: 'Contact',
    blog: 'Blog',
    login: 'Connexion',
    signup: "S'inscrire",
    title: 'La facturation simplifiée pour les',
    highlight: 'professionnels',
    subtitle:
      'Créez vos factures et devis, préremplissez-les depuis une photo ou votre voix, puis suivez les paiements depuis une application installable sur mobile.',
    createInvoice: 'Créer une facture',
    createQuote: 'Créer un devis',
    learn: 'Découvrir les fonctionnalités',
    benefits: ['Compte gratuit', 'Saisie photo et vocale', 'Application mobile installable'],
    featuresEyebrow: 'Fonctionnalités',
    featuresTitle: 'Moins de saisie, plus de temps pour votre activité',
    featuresIntro:
      'Factumation réunit la création, le suivi et l’assistance intelligente dans un outil adapté aux indépendants et petites entreprises.',
    features: [
      {
        icon: Camera,
        title: 'Photo et OCR assisté par IA',
        description:
          'Photographiez un document papier : les informations détectées préremplissent votre facture ou votre devis avant validation.',
      },
      {
        icon: Mic,
        title: 'Création par la voix',
        description:
          'Dictez le client, les prestations et les montants. La transcription structure un brouillon que vous vérifiez avant validation.',
      },
      {
        icon: Smartphone,
        title: 'Application PWA installable',
        description:
          'Ajoutez Factumation à l’écran d’accueil de votre téléphone ou ordinateur, sans passer par une boutique d’applications.',
      },
      {
        icon: RefreshCw,
        title: 'Brouillons protégés en cas de coupure',
        description:
          'Si la connexion tombe pendant la saisie, le brouillon est chiffré sur l’appareil puis synchronisé au retour du réseau.',
      },
      {
        icon: FileText,
        title: 'Documents et suivi centralisés',
        description:
          'Créez factures et devis, générez leurs PDF, envoyez-les par e-mail et suivez leur statut avec votre carnet de clients.',
      },
      {
        icon: Building2,
        title: 'Multi-devises et fiscalité locale',
        description:
          'Gérez plusieurs sociétés et travaillez en EUR, USD, GBP, CAD, CHF ou MGA avec les champs SIRET/TVA et NIF/STAT.',
      },
    ],
    processEyebrow: 'Comment ça marche',
    processTitle: 'Du besoin au document en trois étapes',
    process: [
      [
        '1',
        'Saisissez à votre façon',
        'Remplissez le formulaire, prenez une photo ou dictez les informations.',
      ],
      [
        '2',
        'Vérifiez le brouillon',
        'Contrôlez le client, les lignes, la devise, les taxes et le mode de paiement.',
      ],
      [
        '3',
        'Finalisez et suivez',
        'Créez le PDF, envoyez le document et suivez son statut dans votre tableau de bord.',
      ],
    ],
    faqEyebrow: 'Questions fréquentes',
    faqTitle: 'Ce qu’il faut savoir avant de commencer',
    faqs: [
      {
        question: 'Peut-on installer Factumation sur un téléphone ?',
        answer:
          'Oui. Factumation est une PWA installable depuis le navigateur sur Android, iPhone et ordinateur. Elle s’ouvre ensuite comme une application.',
      },
      {
        question: 'Puis-je continuer une facture si la connexion se coupe ?',
        answer:
          'Oui, lorsque le formulaire était déjà ouvert. Le brouillon peut être chiffré sur l’appareil et synchronisé au retour du réseau. Un démarrage entièrement hors ligne affiche actuellement un écran de secours.',
      },
      {
        question: 'La photo et la voix créent-elles directement une facture définitive ?',
        answer:
          'Non. Elles préremplissent un brouillon. Vous vérifiez et corrigez toujours les informations avant de créer, télécharger ou envoyer le document.',
      },
      {
        question: 'Quelles devises et informations fiscales sont prises en charge ?',
        answer:
          'Factumation prend en charge EUR, USD, GBP, CAD, CHF et MGA, ainsi que les champs SIRET/TVA pour l’Europe et NIF/STAT pour Madagascar.',
      },
    ],
    finalTitle: 'Prêt à simplifier votre prochaine facture ?',
    finalText:
      'Créez votre compte, enregistrez votre société et préparez un premier document depuis votre ordinateur ou votre téléphone.',
    finalAction: 'Commencer gratuitement',
  },
  en: {
    home: 'Home',
    invoice: 'Invoice',
    quote: 'Quote',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    blog: 'Blog',
    login: 'Sign in',
    signup: 'Sign up',
    title: 'Simplified invoicing for',
    highlight: 'professionals',
    subtitle:
      'Create invoices and quotes, prefill them from a photo or your voice, and track payments from an app you can install on your phone.',
    createInvoice: 'Create an invoice',
    createQuote: 'Create a quote',
    learn: 'Explore the features',
    benefits: ['Free account', 'Photo and voice input', 'Installable mobile app'],
    featuresEyebrow: 'Features',
    featuresTitle: 'Less data entry, more time for your business',
    featuresIntro:
      'Factumation brings document creation, tracking and smart assistance together for freelancers and small businesses.',
    features: [
      {
        icon: Camera,
        title: 'AI-assisted photo OCR',
        description:
          'Photograph a paper document and use the detected information to prefill an invoice or quote before review.',
      },
      {
        icon: Mic,
        title: 'Voice-powered creation',
        description:
          'Dictate the customer, services and amounts. The transcript structures a draft that you always review before use.',
      },
      {
        icon: Smartphone,
        title: 'Installable PWA',
        description:
          'Add Factumation to your phone or computer home screen without downloading it from an app store.',
      },
      {
        icon: RefreshCw,
        title: 'Protected drafts during outages',
        description:
          'If the connection drops while you work, the draft is encrypted on the device and synced when the network returns.',
      },
      {
        icon: FileText,
        title: 'Documents and tracking in one place',
        description:
          'Create invoices and quotes, generate PDFs, send them by email and track their status with your customer directory.',
      },
      {
        icon: Building2,
        title: 'Multiple currencies and local tax data',
        description:
          'Manage multiple businesses and work in EUR, USD, GBP, CAD, CHF or MGA with SIRET/VAT and NIF/STAT fields.',
      },
    ],
    processEyebrow: 'How it works',
    processTitle: 'From request to document in three steps',
    process: [
      ['1', 'Enter details your way', 'Fill in the form, take a photo or dictate the information.'],
      ['2', 'Review the draft', 'Check the customer, items, currency, taxes and payment method.'],
      [
        '3',
        'Finalize and track',
        'Create the PDF, send the document and track its status from your dashboard.',
      ],
    ],
    faqEyebrow: 'Frequently asked questions',
    faqTitle: 'What to know before you start',
    faqs: [
      {
        question: 'Can I install Factumation on a phone?',
        answer:
          'Yes. Factumation is a PWA that can be installed from the browser on Android, iPhone and desktop, then opened like an app.',
      },
      {
        question: 'Can I keep working if the connection drops?',
        answer:
          'Yes, when the form was already open. The draft can be encrypted on the device and synchronized when the network returns. A fully offline cold start currently shows a safe fallback screen.',
      },
      {
        question: 'Do photo and voice create a final invoice automatically?',
        answer:
          'No. They prefill a draft. You always review and correct the information before creating, downloading or sending the document.',
      },
      {
        question: 'Which currencies and tax details are supported?',
        answer:
          'Factumation supports EUR, USD, GBP, CAD, CHF and MGA, plus SIRET/VAT fields for Europe and NIF/STAT fields for Madagascar.',
      },
    ],
    finalTitle: 'Ready to simplify your next invoice?',
    finalText:
      'Create your account, save your business details and prepare your first document from a computer or phone.',
    finalAction: 'Start for free',
  },
} as const;

type SupportedLocale = keyof typeof copy;

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'fr' || locale === 'en';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const base = getSiteUrl();
  const french = locale === 'fr';
  const title = french
    ? 'Logiciel de facturation avec OCR et saisie vocale'
    : 'Invoicing software with OCR and voice input';
  const description = french
    ? 'Créez factures et devis par formulaire, photo ou voix. PWA installable, PDF, multi-devises, clients et suivi des paiements.'
    : 'Create invoices and quotes by form, photo or voice. Installable PWA with PDFs, multiple currencies, customers and payment tracking.';
  return {
    title,
    description,
    keywords: french
      ? [
          'logiciel de facturation',
          'facture OCR',
          'facture par commande vocale',
          'application facture mobile',
          'devis en ligne',
          'facturation Madagascar',
        ]
      : [
          'invoicing software',
          'invoice OCR',
          'voice invoice',
          'mobile invoice app',
          'online quote maker',
        ],
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        'fr-FR': `${base}/fr`,
        en: `${base}/en`,
        'x-default': `${base}/fr`,
      },
    },
    openGraph: {
      type: 'website',
      url: `${base}/${locale}`,
      siteName: 'Factumation',
      locale: french ? 'fr_FR' : 'en_US',
      title,
      description,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = copy[locale];
  const otherLocale = locale === 'fr' ? 'en' : 'fr';
  const links = [
    [t.home, `/${locale}`],
    [t.invoice, `/${locale}/invoices/new`],
    [t.quote, `/${locale}/quotes/new`],
    [t.pricing, `/${locale}/pricing`],
    [t.about, `/${locale}/about`],
    [t.contact, `/${locale}/contact`],
    [t.blog, `/${locale}/blog`],
  ] as const;
  const base = getSiteUrl();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Factumation',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS, Windows, macOS',
      url: `${base}/${locale}`,
      description: t.subtitle,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      featureList: t.features.map((feature) => feature.title),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ];

  return (
    <main lang={locale} className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark locale={locale} />
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label={locale === 'fr' ? 'Navigation principale' : 'Main navigation'}
          >
            {links.map(([label, href], index) => (
              <Link
                key={label}
                href={href}
                className={`focus-ring rounded-sm text-sm font-medium ${index === 0 ? 'border-b-2 border-[var(--primary-900)] pb-1 text-[var(--primary-900)]' : 'text-slate-600 hover:text-[var(--primary-900)]'}`}
              >
                {label}
              </Link>
            ))}
            <Link
              href={`/${otherLocale}`}
              hrefLang={otherLocale}
              className="focus-ring flex items-center gap-2 rounded-sm border-r border-slate-200 pr-6 text-sm text-slate-600 hover:text-[var(--primary-900)]"
              aria-label={locale === 'fr' ? 'Afficher en anglais' : 'View in French'}
            >
              <Globe className="size-4" />
              {otherLocale.toUpperCase()}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
            >
              {t.login}
            </Link>
            <Link
              href={`/${locale}/login?mode=register`}
              className="focus-ring rounded-full bg-[var(--primary-900)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-800)]"
            >
              {t.signup}
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[var(--primary-950)] md:text-6xl">
          {t.title} <span className="text-[var(--primary-500)]">{t.highlight}</span>.
        </h1>
        <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-600 md:text-xl">
          {t.subtitle}
        </p>
        <div className="mt-10 flex w-full max-w-xl flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={`/${locale}/invoices/new`}
            className="focus-ring inline-flex flex-1 items-center justify-center rounded-full bg-[var(--primary-900)] px-8 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-[var(--primary-800)] hover:shadow-xl"
          >
            {t.createInvoice}
            <ArrowRight className="ml-2 size-5" />
          </Link>
          <Link
            href={`/${locale}/quotes/new`}
            className="focus-ring inline-flex flex-1 items-center justify-center rounded-full bg-[var(--primary-500)] px-8 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-[var(--primary-600)] hover:shadow-xl"
          >
            {t.createQuote}
            <ArrowRight className="ml-2 size-5" />
          </Link>
        </div>
        <Link
          href="#features"
          className="mt-6 px-6 py-3 text-sm font-medium text-[var(--primary-900)] hover:text-[var(--primary-800)]"
        >
          {t.learn}
        </Link>
        <div className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-slate-500">
          {t.benefits.map((item) => (
            <span key={item} className="flex items-center">
              <CheckCircle className="mr-2 size-4 text-green-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-600">{t.featuresEyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t.featuresTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{t.featuresIntro}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-6">
                <span className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-blue-600">{t.processEyebrow}</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.processTitle}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.process.map(([number, title, description]) => (
              <article key={number} className="rounded-xl border border-slate-200 bg-white p-6">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--primary-900)] text-sm font-bold text-white">
                  {number}
                </span>
                <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-blue-600">{t.faqEyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.faqTitle}
          </h2>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {t.faqs.map((faq) => (
              <article key={faq.question} className="py-6">
                <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[var(--primary-950)] px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">{t.finalText}</p>
          <Link
            href={`/${locale}/login?mode=register`}
            className="focus-ring mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-semibold text-[var(--primary-950)] hover:bg-blue-50"
          >
            {t.finalAction}
            <ArrowRight className="ml-2 size-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
