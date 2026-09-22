'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';
import type { Company } from '@/lib/api/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(160),
  address: z.string().trim().max(500),
  email: z.union([z.literal(''), z.string().email('Adresse e-mail invalide.')]),
  phone: z.string().trim().max(50),
  fiscalRegion: z.enum(['NONE', 'EU', 'MG']),
  siret: z.string().trim().max(14),
  vatNumber: z.string().trim().max(30),
  nif: z.string().trim().max(50),
  stat: z.string().trim().max(50),
  iban: z.string().trim().max(34),
  bic: z.string().trim().max(11),
  defaultCurrency: z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA']),
  defaultPaymentMethod: z.string().trim().max(100),
  invoicePrefix: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .regex(/^[A-Z0-9-]+$/i, 'Préfixe invalide.'),
  quotePrefix: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .regex(/^[A-Z0-9-]+$/i, 'Préfixe invalide.'),
  notes: z.string().trim().max(2000),
});
type Values = z.infer<typeof schema>;

export function CompanyForm({ locale, initial }: { locale: string; initial?: Company }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      fiscalRegion: initial?.fiscalRegion ?? 'NONE',
      siret: initial?.siret ?? '',
      vatNumber: initial?.vatNumber ?? '',
      nif: initial?.nif ?? '',
      stat: initial?.stat ?? '',
      iban: initial?.iban ?? '',
      bic: initial?.bic ?? '',
      defaultCurrency: (initial?.defaultCurrency as Values['defaultCurrency'] | undefined) ?? 'EUR',
      defaultPaymentMethod: initial?.defaultPaymentMethod ?? 'Virement bancaire',
      invoicePrefix: initial?.invoicePrefix ?? 'INV',
      quotePrefix: initial?.quotePrefix ?? 'DEV',
      notes: initial?.notes ?? '',
    },
  });
  const input =
    'focus-ring mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm';
  const onSubmit = async (data: Values) => {
    setSubmitError(null);
    const optional = (value: string) => value || null;
    try {
      const company = await browserApiRequest<Company>(
        initial ? `/companies/${initial.id}` : '/companies',
        {
          method: initial ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...data,
            email: optional(data.email),
            phone: optional(data.phone),
            address: optional(data.address),
            siret: optional(data.siret),
            vatNumber: optional(data.vatNumber),
            nif: optional(data.nif),
            stat: optional(data.stat),
            iban: optional(data.iban),
            bic: optional(data.bic),
            notes: optional(data.notes),
          }),
        },
      );
      router.push(`/${locale}/companies/${company.id}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof BrowserApiError ? error.message : 'Une erreur inattendue est survenue.',
      );
    }
  };
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/companies`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" />
        Retour aux entreprises
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--primary-600)]">Paramètres</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {initial ? 'Modifier l’entreprise' : 'Ajouter une entreprise'}
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Section>
          <Field label="Nom *" error={errors.name?.message}>
            <input {...register('name')} className={input} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <input type="email" {...register('email')} className={input} />
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            <input {...register('phone')} className={input} />
          </Field>
          <Field label="Région fiscale">
            <select {...register('fiscalRegion')} className={input}>
              <option value="NONE">Non renseignée</option>
              <option value="EU">Union européenne</option>
              <option value="MG">Madagascar</option>
            </select>
          </Field>
          <Field label="Adresse" wide>
            <textarea
              rows={3}
              {...register('address')}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </Field>
        </Section>
        <Section>
          <Field label="Devise">
            <select {...register('defaultCurrency')} className={input}>
              {['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Mode de paiement">
            <input {...register('defaultPaymentMethod')} className={input} />
          </Field>
          <Field label="Préfixe facture" error={errors.invoicePrefix?.message}>
            <input {...register('invoicePrefix')} className={input} />
          </Field>
          <Field label="Préfixe devis" error={errors.quotePrefix?.message}>
            <input {...register('quotePrefix')} className={input} />
          </Field>
        </Section>
        <Section>
          <Field label="SIRET" error={errors.siret?.message}>
            <input {...register('siret')} className={input} />
          </Field>
          <Field label="N° TVA" error={errors.vatNumber?.message}>
            <input {...register('vatNumber')} className={input} />
          </Field>
          <Field label="NIF">
            <input {...register('nif')} className={input} />
          </Field>
          <Field label="STAT">
            <input {...register('stat')} className={input} />
          </Field>
          <Field label="IBAN">
            <input {...register('iban')} className={input} />
          </Field>
          <Field label="BIC">
            <input {...register('bic')} className={input} />
          </Field>
          <Field label="Notes" wide>
            <textarea
              rows={4}
              {...register('notes')}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </Field>
        </Section>
        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {submitError}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Link
            href={initial ? `/${locale}/companies/${initial.id}` : `/${locale}/companies`}
            className="focus-ring rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Annuler
          </Link>
          <button
            disabled={isSubmitting}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}Enregistrer
          </button>
        </div>
      </form>
    </main>
  );
}
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
      {children}
    </section>
  );
}
function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string | undefined;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
