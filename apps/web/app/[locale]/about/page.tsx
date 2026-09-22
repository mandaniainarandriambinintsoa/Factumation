import { Building2, FileText, History, Mail, Shield, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Découvrez Factumation, la facturation simple pour les professionnels.',
};
const featuresFr = [
  [FileText, 'Documents professionnels', 'Des factures et devis clairs, prêts à partager.'],
  [Zap, 'Création rapide', 'Les calculs et totaux sont générés automatiquement.'],
  [Users, 'Carnet clients', 'Centralisez les coordonnées utiles à vos documents.'],
  [Building2, 'Multi-entreprises', 'Gérez plusieurs activités depuis un seul compte.'],
  [History, 'Historique', 'Retrouvez chaque document et suivez son statut.'],
  [Mail, 'Envoi simplifié', 'Préparez vos documents pour les transmettre à vos clients.'],
];
const featuresEn = [
  [FileText, 'Professional documents', 'Clear invoices and quotes, ready to share.'],
  [Zap, 'Fast creation', 'Calculations and totals are generated automatically.'],
  [Users, 'Customer directory', 'Keep the contact details used in your documents together.'],
  [Building2, 'Multiple businesses', 'Manage several businesses from one account.'],
  [History, 'History', 'Find every document and track its status.'],
  [Mail, 'Simple delivery', 'Prepare and send documents to your customers.'],
];
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const copy =
    locale === 'fr'
      ? {
          title: 'La facturation pensée pour rester simple',
          intro:
            'Factumation aide les indépendants et petites entreprises à créer des documents fiables sans outils compliqués.',
          features: featuresFr,
        }
      : {
          title: 'Invoicing designed to stay simple',
          intro:
            'Factumation helps freelancers and small businesses create reliable documents without complicated tools.',
          features: featuresEn,
        };
  return (
    <PublicShell locale={locale} active="about">
      <main>
        <section className="bg-[var(--primary-950)] px-5 py-20 text-center text-white">
          <Shield className="mx-auto size-10 text-blue-300" />
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold sm:text-5xl">{copy.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">{copy.intro}</p>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {copy.features.map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof FileText;
              return (
                <article
                  key={String(title)}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <FeatureIcon className="size-5" />
                  </span>
                  <h2 className="mt-5 font-semibold text-slate-900">{String(title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{String(description)}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
