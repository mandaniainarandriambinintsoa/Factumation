import { Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l’équipe Factumation.',
};
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();
  const t =
    locale === 'fr'
      ? {
          title: 'Parlons de votre besoin',
          intro: 'Une question sur Factumation ? Nous vous répondons directement.',
          phone: 'Téléphone',
          address: 'Adresse',
        }
      : {
          title: 'Let’s talk about your needs',
          intro: 'Have a question about Factumation? We will answer you directly.',
          phone: 'Phone',
          address: 'Address',
        };
  return (
    <PublicShell locale={locale} active="contact">
      <main className="mx-auto max-w-5xl px-5 py-16 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">Contact</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">{t.intro}</p>
        </div>
        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            [
              Mail,
              'E-mail',
              'mandaniaina.randriambinitsoa@gmail.com',
              'mailto:mandaniaina.randriambinitsoa@gmail.com',
            ],
            [Phone, t.phone, '+261 34 65 186 95', 'tel:+261346518695'],
            [MapPin, t.address, 'Antananarivo, Madagascar', null],
          ].map(([Icon, title, value, href]) => {
            const ContactIcon = Icon as typeof Mail;
            return (
              <article
                key={String(title)}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center"
              >
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <ContactIcon className="size-5" />
                </span>
                <h2 className="mt-4 font-semibold text-slate-900">{String(title)}</h2>
                {href ? (
                  <a
                    href={String(href)}
                    className="mt-2 block break-all text-sm text-blue-700 hover:underline"
                  >
                    {String(value)}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">{String(value)}</p>
                )}
              </article>
            );
          })}
        </section>
        <section className="mt-10">
          <ContactForm locale={locale} />
        </section>
      </main>
    </PublicShell>
  );
}
