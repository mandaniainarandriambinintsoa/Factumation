'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { calculateDocument } from '@factumation/domain';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { browserApiDownload, browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';
import type { Client, Company, Invoice, Quote } from '@/lib/api/types';

import { DocumentActionStep, type SubmissionAction } from './document-form/document-action-step';
import { DocumentBillingStep } from './document-form/document-billing-step';
import { DocumentClientStep } from './document-form/document-client-step';
import { DocumentItemsStep } from './document-form/document-items-step';
import { DocumentReviewStep } from './document-form/document-review-step';
import {
  billingStepFields,
  clientStepFields,
  createDocumentDefaultValues,
  documentFormSchema,
  type DocumentFormValues,
} from './document-form/document-form-schema';
import { DocumentTotals } from './document-form/document-form-shared';

const MOBILE_STEPS = ['Client', 'Prestations', 'Facturation', 'Vérification', 'Action'] as const;

export function DocumentForm({
  locale,
  kind,
  companies,
  clients,
  initial,
}: {
  locale: string;
  kind: 'invoice' | 'quote';
  companies: Company[];
  clients: Client[];
  initial?: Invoice | Quote;
}) {
  const router = useRouter();
  const invoice = kind === 'invoice';
  const collection = invoice ? 'invoices' : 'quotes';
  const idempotencyKey = useRef(crypto.randomUUID());
  const persistedDocument = useRef<Invoice | Quote | null>(initial ?? null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [submissionAction, setSubmissionAction] = useState<SubmissionAction | null>(null);
  const [saveLocal, setSaveLocal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<DocumentFormValues | null>(null);
  const draftKey = `factumation-document-draft-v2-${kind}`;
  const defaultValues = useMemo(
    () => createDocumentDefaultValues(companies, initial),
    [companies, initial],
  );
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const values = watch();

  useEffect(() => {
    if (initial) return;
    try {
      const current = localStorage.getItem(draftKey);
      const legacy = localStorage.getItem(`factumation-document-draft-v1-${kind}`);
      const raw = current ?? legacy;
      if (!raw) return;
      const parsed = JSON.parse(raw) as { kind?: string; values?: unknown };
      if (parsed.kind !== kind || !parsed.values || typeof parsed.values !== 'object') return;
      const validated = documentFormSchema.safeParse({
        ...defaultValues,
        ...parsed.values,
        clientMode:
          'clientMode' in parsed.values ? parsed.values.clientMode : defaultValues.clientMode,
      });
      if (validated.success) setSavedDraft(validated.data);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [defaultValues, draftKey, initial, kind]);

  useEffect(() => {
    if (initial || !saveLocal) return;
    const subscription = watch((next) => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ version: 2, kind, savedAt: new Date().toISOString(), values: next }),
      );
    });
    return () => subscription.unsubscribe();
  }, [draftKey, initial, kind, saveLocal, watch]);

  const calculation = useMemo(() => {
    try {
      return calculateDocument({
        currency: values.currency,
        items: values.items,
        taxMode: values.taxMode,
        taxRate: values.taxRate,
      });
    } catch {
      return null;
    }
  }, [values.currency, values.items, values.taxMode, values.taxRate]);

  async function saveDocument(data: DocumentFormValues): Promise<Invoice | Quote> {
    if (persistedDocument.current && !initial) return persistedDocument.current;
    const optional = (value: string) => value || null;
    const documentFields = {
      items: data.items,
      currency: data.currency,
      ...(invoice
        ? { invoiceDate: data.documentDate, dueDate: data.secondDate }
        : { quoteDate: data.documentDate, validityDate: data.secondDate }),
      taxMode: data.taxMode,
      taxRate: data.taxRate,
      paymentMethod: optional(data.paymentMethod),
      notes: optional(data.notes),
    };
    const payload = initial
      ? documentFields
      : {
          companyId: data.companyId,
          ...(data.clientMode === 'new'
            ? {
                client: {
                  name: data.clientName,
                  email: data.clientEmail,
                  phone: optional(data.clientPhone),
                  address: optional(data.clientAddress),
                  companyName: optional(data.clientCompanyName),
                  fiscalRegion: data.clientFiscalRegion,
                  siret: optional(data.clientSiret),
                  vatNumber: optional(data.clientVatNumber),
                  nif: optional(data.clientNif),
                  stat: optional(data.clientStat),
                },
              }
            : { clientId: data.clientId }),
          ...documentFields,
        };
    const saved = await browserApiRequest<Invoice | Quote>(
      initial ? `/${collection}/${initial.id}` : `/${collection}`,
      {
        method: initial ? 'PATCH' : 'POST',
        ...(!initial ? { headers: { 'Idempotency-Key': idempotencyKey.current } } : {}),
        body: JSON.stringify(payload),
      },
    );
    persistedDocument.current = saved;
    return saved;
  }

  async function downloadPdf(id: string): Promise<void> {
    const blob = await browserApiDownload(`/${collection}/${id}/pdf`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoice ? 'Facture' : 'Devis'}-${id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function submit(data: DocumentFormValues, action: SubmissionAction): Promise<void> {
    setSubmissionAction(action);
    setSubmitError(null);
    try {
      let saved = await saveDocument(data);
      if (!initial && action !== 'draft' && saved.status === 'draft') {
        saved = await browserApiRequest<Invoice | Quote>(`/${collection}/${saved.id}/issue`, {
          method: 'POST',
        });
        persistedDocument.current = saved;
      }
      if (!initial && action === 'send' && saved.status === 'issued') {
        saved = await browserApiRequest<Invoice | Quote>(`/${collection}/${saved.id}/send`, {
          method: 'POST',
        });
        persistedDocument.current = saved;
      }
      if (!initial && action === 'pdf') await downloadPdf(saved.id);
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`factumation-document-draft-v1-${kind}`);
      router.push(`/${locale}/${collection}/${saved.id}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof BrowserApiError
          ? `${error.message}${error.requestId ? ` (référence ${error.requestId})` : ''}`
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setSubmissionAction(null);
    }
  }

  function runAction(action: SubmissionAction): void {
    void handleSubmit(
      (data) => submit(data, action),
      () => setSubmissionAction(null),
    )();
  }

  async function continueToNextStep(): Promise<void> {
    const valid =
      step === 0
        ? await trigger(clientStepFields)
        : step === 1
          ? await trigger('items')
          : step === 2
            ? await trigger(billingStepFields)
            : await trigger();
    if (valid) setStep((current) => Math.min(MOBILE_STEPS.length - 1, current + 1));
  }

  if (!companies.length) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h1 className="font-semibold text-amber-950">Ajoutez d’abord une entreprise</h1>
          <p className="mt-1 text-sm text-amber-900">
            Une entreprise émettrice est obligatoire pour créer un document.
          </p>
          <Link
            href={`/${locale}/companies/new`}
            className="mt-4 inline-flex rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Ajouter une entreprise
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/${collection}`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--primary-600)]">
          {initial ? 'Brouillon' : 'Nouveau document'}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {initial ? 'Modifier' : 'Créer'} {invoice ? 'une facture' : 'un devis'}
        </h1>
      </div>
      <form
        onSubmit={handleSubmit((data) => submit(data, 'draft'))}
        className="mt-8 space-y-5"
        noValidate
      >
        <MobileProgress step={step} />
        {savedDraft ? (
          <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
            <span>Un brouillon local est disponible sur cet appareil.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  reset(savedDraft);
                  setSaveLocal(true);
                  setSavedDraft(null);
                }}
                className="font-semibold underline"
              >
                Restaurer
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(draftKey);
                  localStorage.removeItem(`factumation-document-draft-v1-${kind}`);
                  setSavedDraft(null);
                }}
                className="text-blue-700"
              >
                Ignorer
              </button>
            </div>
          </div>
        ) : null}

        <DocumentClientStep
          active={step === 0}
          initial={initial}
          companies={companies}
          clients={clients}
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
        <DocumentBillingStep
          active={step === 2}
          invoice={invoice}
          values={values}
          register={register}
          errors={errors}
          setValue={setValue}
        />
        <DocumentReviewStep
          active={step === 3}
          invoice={invoice}
          companies={companies}
          clients={clients}
          values={values}
          calculation={calculation}
          locale={locale}
        />
        <DocumentActionStep
          active={step === 4}
          invoice={invoice}
          editing={Boolean(initial)}
          pendingAction={submissionAction}
          onAction={runAction}
        />

        <section className="ml-auto hidden max-w-md rounded-xl border border-slate-200 bg-white p-5 sm:block">
          <DocumentTotals calculation={calculation} values={values} locale={locale} />
        </section>

        {!initial ? (
          <label
            className={`${step === 4 ? 'flex' : 'hidden'} items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:flex`}
          >
            <input
              type="checkbox"
              checked={saveLocal}
              onChange={(event) => {
                setSaveLocal(event.target.checked);
                if (!event.target.checked) localStorage.removeItem(draftKey);
              }}
              className="mt-0.5 size-4 accent-blue-700"
            />
            <span>
              <strong className="block text-slate-900">
                Sauvegarder ce brouillon sur cet appareil
              </strong>
              Les données restent dans ce navigateur jusqu’à l’enregistrement ou la déconnexion.
            </span>
          </label>
        ) : null}
        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {submitError}
            {persistedDocument.current && !initial ? (
              <Link
                href={`/${locale}/${collection}/${persistedDocument.current.id}`}
                className="ml-2 font-semibold underline"
              >
                Ouvrir le document enregistré
              </Link>
            ) : null}
          </p>
        ) : null}

        <div className="sticky bottom-16 flex justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className={`${step === 0 ? 'hidden' : 'inline-flex'} focus-ring rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 sm:hidden`}
          >
            Précédent
          </button>
          <Link
            href={initial ? `/${locale}/${collection}/${initial.id}` : `/${locale}/${collection}`}
            className="focus-ring hidden rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            Annuler
          </Link>
          {step < MOBILE_STEPS.length - 1 ? (
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
            className="focus-ring hidden min-w-40 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50 sm:inline-flex"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le brouillon'}
          </button>
        </div>
      </form>
    </main>
  );
}

function MobileProgress({ step }: { step: number }) {
  return (
    <div className="sm:hidden" aria-label={`Étape ${step + 1} sur ${MOBILE_STEPS.length}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          Étape {step + 1} sur {MOBILE_STEPS.length}
        </span>
        <span>{MOBILE_STEPS[step]}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[var(--primary-600)] transition-[width]"
          style={{ width: `${((step + 1) / MOBILE_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
