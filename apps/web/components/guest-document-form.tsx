'use client';

import { calculateDocument } from '@factumation/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DocumentBillingStep } from './document-form/document-billing-step';
import {
  billingStepFields,
  createDocumentDefaultValues,
  documentFormSchema,
  type DocumentFormValues,
} from './document-form/document-form-schema';
import { DocumentTotals } from './document-form/document-form-shared';
import { DocumentItemsStep } from './document-form/document-items-step';
import { DocumentPreview } from './document-form/document-preview';
import { DocumentReviewStep } from './document-form/document-review-step';
import { GuestDocumentPartiesStep, type GuestIssuer } from './guest-document-parties-step';
import { GuestDocumentPreview } from './guest-document-preview';

const GUEST_STEPS = ['Client', 'Prestations', 'Facturation', 'Vérification'] as const;
const guestClientFields: Array<keyof DocumentFormValues> = [
  'clientName',
  'clientCompanyName',
  'clientEmail',
  'clientPhone',
  'clientAddress',
  'clientFiscalRegion',
  'clientSiret',
  'clientVatNumber',
  'clientNif',
  'clientStat',
];

const issuerSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(160),
  address: z.string().trim().max(500),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide.')]),
  phone: z.string().trim().max(50),
  fiscalInfo: z.string().trim().max(500),
  number: z.string().trim().min(1, 'Le numéro est requis.').max(80),
});

export function GuestDocumentForm({ locale, kind }: { locale: string; kind: 'invoice' | 'quote' }) {
  const invoice = kind === 'invoice';
  const [preview, setPreview] = useState(false);
  const [step, setStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  async function continueToNextStep(): Promise<void> {
    const valid =
      step === 0
        ? (await issuerForm.trigger()) && (await trigger(guestClientFields))
        : step === 1
          ? await trigger('items')
          : step === 2
            ? await trigger(billingStepFields)
            : await trigger();
    if (valid) setStep((current) => Math.min(GUEST_STEPS.length - 1, current + 1));
  }

  async function showPreview(): Promise<void> {
    if (await issuerForm.trigger()) setPreview(true);
  }

  if (preview) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
        <DocumentPreview
          guest
          guestIssuer={issuer}
          invoice={invoice}
          companies={[]}
          clients={[]}
          values={values}
          calculation={calculation}
          locale={locale}
          pendingAction={downloading ? 'pdf' : null}
          onEdit={() => setPreview(false)}
          onAction={() => void download()}
        />
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
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
        {downloadError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {downloadError}
          </p>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-64 pt-8 lg:px-10 lg:pt-12">
      <Link
        href={`/${locale}`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <div className="mt-5">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Créer {invoice ? 'une facture' : 'un devis'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Remplissez les informations puis vérifiez le document avant de le télécharger.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(() => void showPreview())} className="mt-8 space-y-5">
        <aside className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
          <strong className="block">Mode invité — sans connexion</strong>
          <p className="mt-1">
            Rien n’est enregistré. La photo, la saisie vocale, les clients et entreprises
            sauvegardés sont disponibles après connexion.
          </p>
          <Link className="mt-2 inline-block font-semibold underline" href={`/${locale}/login`}>
            Se connecter
          </Link>
        </aside>

        <GuestMobileProgress step={step} />
        <GuestDocumentPartiesStep
          active={step === 0}
          issuerRegister={issuerForm.register}
          issuerErrors={issuerForm.formState.errors}
          values={values}
          register={register}
          errors={errors}
        />
        <DocumentBillingStep
          active={step === 2}
          invoice={invoice}
          values={values}
          register={register}
          errors={errors}
          setValue={setValue}
        />
        <DocumentItemsStep
          active={step === 1}
          values={values}
          register={register}
          errors={errors}
          append={append}
          remove={remove}
          fieldIds={fields}
          calculation={calculation}
          locale={locale}
        />
        <DocumentReviewStep
          active={step === 3}
          invoice={invoice}
          companies={[]}
          clients={[]}
          issuerName={issuer.name}
          values={values}
          calculation={calculation}
          locale={locale}
        />

        <section className="ml-auto hidden max-w-md rounded-xl border border-slate-200 bg-white p-5 sm:block">
          <DocumentTotals calculation={calculation} values={values} locale={locale} />
        </section>

        <div className="sticky bottom-4 flex justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className={`${step === 0 ? 'hidden' : 'inline-flex'} focus-ring rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 sm:hidden`}
          >
            Précédent
          </button>
          <Link
            href={`/${locale}`}
            className="focus-ring hidden rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            Annuler
          </Link>
          {step < GUEST_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => void continueToNextStep()}
              className="focus-ring ml-auto rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white sm:hidden"
            >
              Continuer
            </button>
          ) : null}
          <button
            disabled={isSubmitting}
            className={`${step === GUEST_STEPS.length - 1 ? 'inline-flex' : 'hidden'} focus-ring min-w-40 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50 sm:inline-flex`}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting
              ? 'Vérification…'
              : `Prévisualiser ${invoice ? 'la facture' : 'le devis'}`}
          </button>
        </div>
      </form>
    </main>
  );
}

function GuestMobileProgress({ step }: { step: number }) {
  return (
    <div className="sm:hidden" aria-label={`Étape ${step + 1} sur ${GUEST_STEPS.length}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          Étape {step + 1} sur {GUEST_STEPS.length}
        </span>
        <span>{GUEST_STEPS[step]}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[var(--primary-600)] transition-[width]"
          style={{ width: `${((step + 1) / GUEST_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
