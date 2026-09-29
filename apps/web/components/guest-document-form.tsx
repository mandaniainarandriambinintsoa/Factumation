'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { calculateDocument } from '@factumation/domain';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DocumentBillingStep } from './document-form/document-billing-step';
import { DocumentClientStep } from './document-form/document-client-step';
import { DocumentItemsStep } from './document-form/document-items-step';
import {
  createDocumentDefaultValues,
  documentFormSchema,
  type DocumentFormValues,
} from './document-form/document-form-schema';
import { Field, fieldClass } from './document-form/document-form-shared';
import { GuestDocumentPreview } from './guest-document-preview';

const issuerSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(160),
  address: z.string().trim().max(500),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide.')]),
  phone: z.string().trim().max(50),
  fiscalInfo: z.string().trim().max(500),
  number: z.string().trim().min(1, 'Le numéro est requis.').max(80),
});
export type GuestIssuer = z.infer<typeof issuerSchema>;

export function GuestDocumentForm({ locale, kind }: { locale: string; kind: 'invoice' | 'quote' }) {
  const invoice = kind === 'invoice';
  const [preview, setPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { ...createDocumentDefaultValues([]), clientMode: 'new' },
  });
  const issuerForm = useForm<GuestIssuer>({
    resolver: zodResolver(issuerSchema),
    defaultValues: { name: '', address: '', email: '', phone: '', fiscalInfo: '', number: '' },
  });
  const issuer = issuerForm.watch();
  const values = watch();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const calculation = (() => {
    try {
      return calculateDocument(values);
    } catch {
      return null;
    }
  })();

  async function download() {
    if (!printRef.current || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 10,
          filename: `${invoice ? 'Facture' : 'Devis'}-${issuer.number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            // The print component uses inline styles. Isolate it from Tailwind's
            // modern color syntax, which html2canvas does not support.
            onclone: (document: Document) => {
              document
                .querySelectorAll('style, link[rel="stylesheet"]')
                .forEach((node) => node.remove());
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save();
    } catch {
      setDownloadError('Le téléchargement a échoué. Réessayez en conservant cette page ouverte.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Créer {invoice ? 'une facture' : 'un devis'}
      </h1>
      <aside className="my-5 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
        <strong className="block text-base">Mode invité — sans connexion</strong>
        <p className="mt-2">
          Saisissez vos informations, prévisualisez et téléchargez votre PDF. Rien n’est enregistré
          dans votre compte ; les informations saisies sont perdues en quittant cette page.
        </p>
        <p className="mt-2">
          L’envoi par e-mail, les sociétés et clients sauvegardés et l’historique sont réservés aux
          utilisateurs connectés.
        </p>
        <Link className="mt-3 inline-block font-semibold underline" href={`/${locale}/login`}>
          Se connecter pour accéder aux fonctions du compte
        </Link>
      </aside>
      <nav aria-label="Type de document" className="mb-6 flex gap-4">
        <Link
          className="font-semibold underline"
          aria-current={invoice ? 'page' : undefined}
          href={`/${locale}/invoices/new`}
        >
          Facture
        </Link>
        <Link
          className="font-semibold underline"
          aria-current={!invoice ? 'page' : undefined}
          href={`/${locale}/quotes/new`}
        >
          Devis
        </Link>
      </nav>
      {preview ? (
        <section aria-label="Aperçu du document">
          <h2 className="mb-4 text-xl font-bold">Aperçu</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <div
              ref={printRef}
              style={{
                width: 700,
                padding: 24,
                boxSizing: 'border-box',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
              }}
            >
              <GuestDocumentPreview
                invoice={invoice}
                issuer={issuer}
                values={values}
                calculation={calculation}
                locale={locale}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={downloading}
              onClick={() => setPreview(false)}
              className="focus-ring rounded-lg border border-slate-300 px-5 py-3 font-semibold"
            >
              Modifier
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={() => void download()}
              className="focus-ring rounded-lg bg-[var(--primary-900)] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {downloading ? 'Génération…' : 'Télécharger le PDF'}
            </button>
          </div>
          {downloadError ? (
            <p role="alert" className="mt-3 text-red-700">
              {downloadError}
            </p>
          ) : null}
        </section>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            void issuerForm.trigger();
            void handleSubmit(async () => {
              if (await issuerForm.trigger()) setPreview(true);
            })(event);
          }}
          className="space-y-5"
        >
          <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Émetteur — saisie manuelle</h2>
            {(
              [
                ['name', 'Nom de l’émetteur *'],
                ['number', 'Numéro du document *'],
                ['email', 'E-mail de l’émetteur'],
                ['phone', 'Téléphone de l’émetteur'],
                ['address', 'Adresse de l’émetteur'],
                ['fiscalInfo', 'Identifiants fiscaux (SIRET, TVA, NIF, STAT)'],
              ] as const
            ).map(([name, label]) => (
              <Field key={name} label={label} error={issuerForm.formState.errors[name]?.message}>
                <input
                  type={name === 'email' ? 'email' : 'text'}
                  {...issuerForm.register(name)}
                  className={fieldClass}
                />
              </Field>
            ))}
            <p className="text-xs text-slate-500 sm:col-span-2">
              Choisissez un numéro conforme à votre numérotation : aucun numéro n’est réservé dans
              un compte.
            </p>
          </section>
          <DocumentClientStep
            active
            guest
            companies={[]}
            clients={[]}
            values={values}
            register={register}
            errors={errors}
            setValue={setValue}
          />
          <DocumentBillingStep
            active
            invoice={invoice}
            values={values}
            register={register}
            errors={errors}
            setValue={setValue}
          />
          <DocumentItemsStep
            active
            values={values}
            register={register}
            errors={errors}
            append={append}
            remove={remove}
            fieldIds={fields}
            calculation={calculation}
            locale={locale}
          />
          <button className="focus-ring rounded-lg bg-[var(--primary-900)] px-5 py-3 font-semibold text-white">
            Prévisualiser {invoice ? 'la facture' : 'le devis'}
          </button>
        </form>
      )}
    </main>
  );
}
