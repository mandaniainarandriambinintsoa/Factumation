'use client';

import {
  BookOpen,
  ClipboardList,
  FileText,
  Globe,
  History,
  Home,
  Info,
  LogOut,
  Mail,
  Settings,
  Shield,
  Tag,
  Users,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { signOut } from '@/app/[locale]/(app)/actions';
import { clearLocalUserData } from './service-worker-registration';
import { BrandMark } from './brand-mark';

export function AppShell({
  locale,
  email,
  children,
}: {
  locale: string;
  email: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const primary = [
    [`/${locale}/dashboard`, 'Accueil', Home],
    [`/${locale}/invoices/new`, 'Facture', FileText],
    [`/${locale}/quotes/new`, 'Devis', ClipboardList],
    [`/${locale}/invoices`, 'Historique', History],
  ] as const;
  const secondary = [
    [`/${locale}/pricing`, 'Tarifs', Tag],
    [`/${locale}/about`, 'À propos', Info],
    [`/${locale}/contact`, 'Contact', Mail],
    [`/${locale}/blog`, 'Blog', BookOpen],
  ] as const;
  const mobile = [
    [`/${locale}/dashboard`, 'Accueil', Home],
    [`/${locale}/invoices`, 'Factures', FileText],
    [`/${locale}/quotes`, 'Devis', ClipboardList],
    [`/${locale}/clients`, 'Clients', Users],
    [`/${locale}/companies`, 'Sociétés', Building2],
  ] as const;
  const linkClass = (href: string) =>
    `focus-ring flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${pathname === href ? 'bg-blue-50 text-[var(--primary-900)]' : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--primary-900)]'}`;
  return (
    <div className="min-h-screen bg-slate-50 xl:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white xl:flex">
        <div className="flex h-14 items-center border-b border-slate-100 px-5">
          <BrandMark locale={locale} compact />
        </div>
        <div className="px-3 pb-2 pt-5">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <nav className="space-y-1">
            {primary.map(([href, label, Icon]) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-3 pb-2 pt-3">
          <hr className="mb-3 border-slate-100" />
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Autres
          </p>
          <nav className="space-y-1">
            {secondary.map(([href, label, Icon]) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-3 pb-4">
          <hr className="mb-3 border-slate-100" />
          {email === 'mandaniaina.randriambinintsoa@gmail.com' ? (
            <Link href={`/${locale}/admin`} className={linkClass(`/${locale}/admin`)}>
              <Shield size={18} />
              Admin
            </Link>
          ) : null}
          <Link href={`/${locale}/settings`} className={linkClass(`/${locale}/settings`)}>
            <Settings size={18} />
            Paramètres
          </Link>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="truncate px-4 text-sm font-medium text-slate-900">
              {email?.split('@')[0]}
            </p>
            <p className="truncate px-4 text-xs text-slate-500">{email}</p>
            <form action={signOut} onSubmit={() => void clearLocalUserData()} className="mt-2">
              <input type="hidden" name="locale" value={locale} />
              <button className="focus-ring flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut size={18} />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 xl:justify-end">
        <div className="xl:hidden">
          <BrandMark locale={locale} compact />
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <button className="focus-ring flex items-center gap-2 rounded-md">
            <Globe size={18} />
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          <Link
            href={`/${locale}/settings`}
            className="focus-ring hidden items-center gap-2 rounded-md sm:flex"
          >
            <Settings size={18} />
            Paramètres
          </Link>
        </div>
      </header>
      <div className="min-h-[calc(100vh-8rem)] pb-24 xl:pb-0">{children}</div>
      <footer className="hidden h-24 items-center justify-between border-t border-slate-200 bg-white px-10 text-sm text-slate-500 xl:flex">
        <span>© 2026 Factumation. Tous droits réservés.</span>
        <span>Blog</span>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 xl:hidden"
        aria-label="Navigation mobile"
      >
        {mobile.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={`focus-ring flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] ${pathname === href ? 'text-[var(--primary-900)]' : 'text-slate-500'}`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
