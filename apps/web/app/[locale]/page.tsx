import { ArrowRight, CheckCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BrandMark } from '@/components/brand-mark';

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
      'Créez, gérez et envoyez des factures élégantes en quelques secondes. Idéal pour les professionnels en France, Madagascar et Afrique francophone. Aucune inscription requise.',
    createInvoice: 'Créer une facture',
    createQuote: 'Créer un devis',
    learn: 'En savoir plus',
    free: '100% Gratuit',
    noCard: 'Pas de carte requise',
    webhook: 'Export Webhook',
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
      'Create, manage and send elegant invoices in seconds. Built for professionals in France, Madagascar and French-speaking Africa. No registration required.',
    createInvoice: 'Create an invoice',
    createQuote: 'Create a quote',
    learn: 'Learn more',
    free: '100% Free',
    noCard: 'No card required',
    webhook: 'Webhook export',
  },
} as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const t = copy[locale];
  const links = [
    [t.home, `/${locale}`],
    [t.invoice, `/${locale}/invoices/new`],
    [t.quote, `/${locale}/quotes/new`],
    [t.pricing, `/${locale}/pricing`],
    [t.about, `/${locale}/about`],
    [t.contact, `/${locale}/contact`],
    [t.blog, `/${locale}/blog`],
  ] as const;
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark locale={locale} />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {links.map(([label, href], index) => (
              <Link
                key={label}
                href={href}
                className={`focus-ring rounded-sm text-sm font-medium ${index === 0 ? 'border-b-2 border-[var(--primary-900)] pb-1 text-[var(--primary-900)]' : 'text-slate-600 hover:text-[var(--primary-900)]'}`}
              >
                {label}
              </Link>
            ))}
            <span className="flex items-center gap-2 border-r border-slate-200 pr-6 text-sm text-slate-600">
              <Globe className="size-4" />
              {locale === 'fr' ? 'EN' : 'FR'}
            </span>
            <Link
              href={`/${locale}/login`}
              className="text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
            >
              {t.login}
            </Link>
            <Link
              href={`/${locale}/login`}
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
          href="#about"
          className="mt-6 px-6 py-3 text-sm font-medium text-[var(--primary-900)] hover:text-[var(--primary-800)]"
        >
          {t.learn}
        </Link>
        <div className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-slate-500">
          {[t.free, t.noCard, t.webhook].map((item) => (
            <span key={item} className="flex items-center">
              <CheckCircle className="mr-2 size-4 text-green-500" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
