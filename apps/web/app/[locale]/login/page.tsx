import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandMark } from '@/components/brand-mark';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: false } };

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col bg-white px-5 py-6 sm:px-10 lg:px-16">
        <BrandMark locale={locale} />
        <div className="mx-auto my-auto w-full max-w-md py-16">
          <p className="text-sm font-semibold text-[var(--primary-600)]">Votre espace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--primary-950)]">
            Bienvenue sur Factumation
          </h1>
          <p className="mt-4 text-slate-500">
            Un espace net pour vos documents, vos clients et les paiements qui avancent.
          </p>
          <div className="mt-10">
            <LoginForm
              locale={locale}
              initialIntent={query.mode === 'register' ? 'signup' : 'login'}
            />
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            <Link href={`/${locale}`} className="underline underline-offset-4">
              Retour à l’accueil
            </Link>
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-[var(--primary-950)] p-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-[34rem] rounded-full border border-white/15" />
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
          Le bon chiffre, au bon moment
        </p>
        <blockquote className="relative max-w-2xl text-5xl font-bold leading-tight tracking-tight">
          “Une facture claire est déjà une conversation bien engagée.”
        </blockquote>
        <div className="grid grid-cols-3 gap-5 border-t border-white/20 pt-8 text-sm text-white/65">
          <span>Calculs fiables</span>
          <span>Données isolées</span>
          <span>Mobile d’abord</span>
        </div>
      </aside>
    </main>
  );
}
