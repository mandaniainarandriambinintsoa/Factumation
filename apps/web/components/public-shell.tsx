import { Globe, Menu } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandMark } from './brand-mark';

const labels = {
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
  },
} as const;

export function PublicShell({
  locale,
  active,
  children,
}: {
  locale: 'fr' | 'en';
  active?: string;
  children: ReactNode;
}) {
  const t = labels[locale];
  const links = [
    [`/${locale}`, t.home, 'home'],
    [`/${locale}/invoices/new`, t.invoice, 'invoice'],
    [`/${locale}/quotes/new`, t.quote, 'quote'],
    [`/${locale}/pricing`, t.pricing, 'pricing'],
    [`/${locale}/about`, t.about, 'about'],
    [`/${locale}/contact`, t.contact, 'contact'],
    [`/${locale}/blog`, t.blog, 'blog'],
  ] as const;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark locale={locale} />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {links.map(([href, label, id]) => (
              <Link
                key={id}
                href={href}
                className={`focus-ring rounded-sm text-sm font-medium ${active === id ? 'border-b-2 border-[var(--primary-900)] pb-1 text-[var(--primary-900)]' : 'text-slate-600 hover:text-[var(--primary-900)]'}`}
              >
                {label}
              </Link>
            ))}
            <Link
              href={`/${locale === 'fr' ? 'en' : 'fr'}`}
              className="flex items-center gap-2 border-r border-slate-200 pr-6 text-sm text-slate-600"
            >
              <Globe className="size-4" />
              {locale === 'fr' ? 'EN' : 'FR'}
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
          <details className="relative lg:hidden">
            <summary className="focus-ring grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-slate-200 text-slate-700 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Ouvrir le menu</span>
              <Menu className="size-5" />
            </summary>
            <nav
              className="absolute right-0 top-12 z-50 grid w-64 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
              aria-label="Navigation mobile"
            >
              {links.map(([href, label, id]) => (
                <Link
                  key={id}
                  href={href}
                  className={`focus-ring rounded-lg px-3 py-2.5 text-sm font-medium ${active === id ? 'bg-blue-50 text-[var(--primary-900)]' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {label}
                </Link>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <Link
                href={`/${locale === 'fr' ? 'en' : 'fr'}`}
                className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Globe className="size-4" />
                {locale === 'fr' ? 'English' : 'Français'}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.login}
              </Link>
              <Link
                href={`/${locale}/login?mode=register`}
                className="focus-ring rounded-lg bg-[var(--primary-900)] px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                {t.signup}
              </Link>
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Factumation. Tous droits réservés.</span>
          <div className="flex gap-5">
            <Link href={`/${locale}/about`}>{t.about}</Link>
            <Link href={`/${locale}/contact`}>{t.contact}</Link>
            <Link href={`/${locale}/blog`}>{t.blog}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
