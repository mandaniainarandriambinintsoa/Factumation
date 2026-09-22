'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';
import type { Client } from '@/lib/api/types';

const optionalText = z.string().trim().max(500);
const schema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(160),
  email: z.string().trim().email('Adresse e-mail invalide.').max(254),
  phone: z.string().trim().max(50),
  address: optionalText,
  companyName: z.string().trim().max(160),
  fiscalRegion: z.enum(['NONE', 'EU', 'MG']),
  siret: z.string().trim().max(14),
  vatNumber: z.string().trim().max(30),
  nif: z.string().trim().max(50),
  stat: z.string().trim().max(50),
  notes: z.string().trim().max(2000),
});
type Values = z.infer<typeof schema>;

export function ClientForm({ locale, initial }: { locale: string; initial?: Client }) {
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
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      address: initial?.address ?? '',
      companyName: initial?.companyName ?? '',
      fiscalRegion: initial?.fiscalRegion ?? 'NONE',
      siret: initial?.siret ?? '',
      vatNumber: initial?.vatNumber ?? '',
      nif: initial?.nif ?? '',
      stat: initial?.stat ?? '',
      notes: initial?.notes ?? '',
    },
  });
  const fieldClass =
    'focus-ring mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm';
  const onSubmit = async (data: Values) => {
    setSubmitError(null);
    const optional = (value: string) => value || null;
    try {
      const client = await browserApiRequest<Client>(
        initial ? `/clients/${initial.id}` : '/clients',
        {
          method: initial ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            fiscalRegion: data.fiscalRegion,
            phone: optional(data.phone),
            address: optional(data.address),
            companyName: optional(data.companyName),
            siret: optional(data.siret),
            vatNumber: optional(data.vatNumber),
            nif: optional(data.nif),
            stat: optional(data.stat),
            notes: optional(data.notes),
          }),
        },
      );
      router.push(`/${locale}/clients/${client.id}`);
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
        href={`/${locale}/clients`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" />
        Retour aux clients
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--primary-600)]">Répertoire</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {initial ? 'Modifier le client' : 'Ajouter un client'}
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Nom *" error={errors.name?.message}>
            <input {...register('name')} className={fieldClass} />
          </Field>
          <Field label="Entreprise" error={errors.companyName?.message}>
            <input {...register('companyName')} className={fieldClass} />
          </Field>
          <Field label="E-mail *" error={errors.email?.message}>
            <input type="email" {...register('email')} className={fieldClass} />
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            <input type="tel" {...register('phone')} className={fieldClass} />
          </Field>
          <Field label="Adresse" error={errors.address?.message} wide>
            <textarea
              rows={3}
              {...register('address')}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </Field>
        </section>
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Région fiscale">
            <select {...register('fiscalRegion')} className={fieldClass}>
              <option value="NONE">Non renseignée</option>
              <option value="EU">Union européenne</option>
              <option value="MG">Madagascar</option>
            </select>
          </Field>
          <div />
          <Field label="SIRET" error={errors.siret?.message}>
            <input {...register('siret')} className={fieldClass} />
          </Field>
          <Field label="N° TVA" error={errors.vatNumber?.message}>
            <input {...register('vatNumber')} className={fieldClass} />
          </Field>
          <Field label="NIF" error={errors.nif?.message}>
            <input {...register('nif')} className={fieldClass} />
          </Field>
          <Field label="STAT" error={errors.stat?.message}>
            <input {...register('stat')} className={fieldClass} />
          </Field>
          <Field label="Notes" error={errors.notes?.message} wide>
            <textarea
              rows={4}
              {...register('notes')}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </Field>
        </section>
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
            href={initial ? `/${locale}/clients/${initial.id}` : `/${locale}/clients`}
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
