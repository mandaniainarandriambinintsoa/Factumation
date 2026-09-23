'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { calculateDocument } from '@factumation/domain';
import type { DocumentImportResponse } from '@factumation/contracts';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { browserApiDownload, browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';
import type { Client, Company, Invoice, Quote } from '@/lib/api/types';
import { normalizePaymentMethod } from '@/lib/document-options';
import {
  OUTBOX_RESULT_EVENT,
  requestDocumentSync,
  type OutboxResult,
} from '@/lib/offline/document-sync';
import {
  deleteEncryptedDraft,
  deleteDocumentJob,
  enqueueDocumentJob,
  listDocumentJobs,
  readEncryptedDraft,
  saveEncryptedDraft,
} from '@/lib/offline/offline-storage';
import { createClient } from '@/lib/supabase/client';

import { DocumentActionStep, type SubmissionAction } from './document-form/document-action-step';
import { DocumentAiImport } from './document-form/document-ai-import';
import { DocumentBillingStep } from './document-form/document-billing-step';
import { DocumentClientStep } from './document-form/document-client-step';
import { DocumentItemsStep } from './document-form/document-items-step';
import { DocumentPreview } from './document-form/document-preview';
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
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [queuedJob, setQueuedJob] = useState<{
    id: string;
    action: SubmissionAction;
    blocked: boolean;
  } | null>(null);
  const [syncedDocumentId, setSyncedDocumentId] = useState<string | null>(null);
  const [localStorageError, setLocalStorageError] = useState<string | null>(null);
  const [desktopPreview, setDesktopPreview] = useState(false);
  const draftKey = `factumation-document-draft-v2-${kind}`;
  const draftLoaded = useRef(false);
  const queuedJobId = useRef<string | null>(null);
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
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues,
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const values = watch();

  useEffect(() => {
    let active = true;
    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setOwnerId(data.session?.user.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initial || !ownerId || draftLoaded.current) return;
    draftLoaded.current = true;
    let active = true;
    void (async () => {
      try {
        let candidate = await readEncryptedDraft<unknown>(ownerId, kind);
        if (!candidate) {
          const raw =
            localStorage.getItem(draftKey) ??
            localStorage.getItem(`factumation-document-draft-v1-${kind}`);
          if (raw) {
            const parsed = JSON.parse(raw) as { kind?: string; values?: unknown };
            if (parsed.kind === kind) candidate = parsed.values;
          }
        }
        const candidateValues =
          candidate && typeof candidate === 'object' ? candidate : ({} as Record<string, never>);
        const validated = documentFormSchema.safeParse({ ...defaultValues, ...candidateValues });
        if (active && validated.success) setSavedDraft(validated.data);
        const jobs = await listDocumentJobs(ownerId, { includeBlocked: true });
        const pending = jobs.find((job) => job.kind === kind);
        if (active && pending) {
          queuedJobId.current = pending.id;
          setQueuedJob({ id: pending.id, action: pending.action, blocked: pending.blocked });
          if (pending.blocked && pending.lastError) setSubmitError(pending.lastError);
        }
        localStorage.removeItem(draftKey);
        localStorage.removeItem(`factumation-document-draft-v1-${kind}`);
      } catch {
        if (active) {
          setLocalStorageError('Le brouillon local n’a pas pu être déchiffré sur cet appareil.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [defaultValues, draftKey, initial, kind, ownerId]);

  useEffect(() => {
    if (initial || !saveLocal || !ownerId || queuedJob) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const subscription = watch((next) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        void saveEncryptedDraft(ownerId, kind, next).catch(() => {
          setLocalStorageError('Le brouillon n’a pas pu être sauvegardé sur cet appareil.');
        });
      }, 500);
    });
    return () => {
      subscription.unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, [initial, kind, ownerId, queuedJob, saveLocal, watch]);

  useEffect(() => {
    const handleResult = (event: Event) => {
      const detail = (event as CustomEvent<OutboxResult>).detail;
      if (detail.jobId !== queuedJobId.current) return;
      if (detail.status === 'synced' && detail.documentId) {
        queuedJobId.current = null;
        setQueuedJob(null);
        setSaveLocal(false);
        setSyncedDocumentId(detail.documentId);
        setSavedDraft(null);
      } else if (detail.status === 'blocked') {
        setQueuedJob((current) => (current ? { ...current, blocked: true } : current));
        setSubmitError(detail.message ?? 'La synchronisation nécessite votre attention.');
      }
    };
    window.addEventListener(OUTBOX_RESULT_EVENT, handleResult);
    return () => window.removeEventListener(OUTBOX_RESULT_EVENT, handleResult);
  }, []);

  // react-hook-form may update nested item values without replacing the array
  // reference. Calculate during render so totals always reflect the latest input.
  const calculation = (() => {
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
  })();

  function buildDocumentPayload(data: DocumentFormValues): Record<string, unknown> {
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
    return initial
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
  }

  async function saveDocument(data: DocumentFormValues): Promise<Invoice | Quote> {
    if (persistedDocument.current && !initial) return persistedDocument.current;
    const payload = buildDocumentPayload(data);
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

  async function queueDocument(data: DocumentFormValues, action: SubmissionAction): Promise<void> {
    const currentOwnerId =
      ownerId ?? (await createClient().auth.getSession()).data.session?.user.id ?? null;
    if (!currentOwnerId) {
      throw new BrowserApiError(401, null, 'Votre session a expiré. Reconnectez-vous.');
    }
    await saveEncryptedDraft(currentOwnerId, kind, data);
    const job = await enqueueDocumentJob({
      ownerId: currentOwnerId,
      kind,
      action,
      locale,
      idempotencyKey: idempotencyKey.current,
      payload: buildDocumentPayload(data),
    });
    setOwnerId(currentOwnerId);
    setSaveLocal(true);
    queuedJobId.current = job.id;
    setQueuedJob({ id: job.id, action, blocked: false });
    setSyncedDocumentId(null);
    setSubmitError(null);
    await requestDocumentSync();
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
      if (!initial && !navigator.onLine) {
        await queueDocument(data, action);
        return;
      }
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
      if (ownerId) await deleteEncryptedDraft(ownerId, kind);
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`factumation-document-draft-v1-${kind}`);
      router.push(`/${locale}/${collection}/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (!initial && error instanceof BrowserApiError && error.status === 0) {
        try {
          await queueDocument(data, action);
          return;
        } catch (queueError) {
          setSubmitError(
            queueError instanceof Error
              ? queueError.message
              : 'Le document n’a pas pu être placé en attente.',
          );
          return;
        }
      }
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
    if (queuedJob) {
      setSubmitError('Ce document est déjà en attente de synchronisation.');
      return;
    }
    if (syncedDocumentId) {
      setSubmitError('Ce document est déjà synchronisé. Ouvrez-le pour continuer.');
      return;
    }
    void handleSubmit(
      (data) => submit(data, action),
      () => setSubmissionAction(null),
    )();
  }

  function applyImportedDocument(result: DocumentImportResponse): void {
    const draft = result.draft;
    const hasClientData = Object.values(draft.client).some(Boolean);
    if (hasClientData) {
      const matchingClient = draft.client.email
        ? clients.find((client) => client.email.toLowerCase() === draft.client.email?.toLowerCase())
        : undefined;
      if (matchingClient) {
        setValue('clientMode', 'existing', { shouldDirty: true });
        setValue('clientId', matchingClient.id, { shouldDirty: true });
      } else {
        setValue('clientMode', 'new', { shouldDirty: true });
        setValue('clientId', '', { shouldDirty: true });
        setValue('clientName', draft.client.name ?? '', { shouldDirty: true });
        setValue('clientCompanyName', draft.client.companyName ?? '', { shouldDirty: true });
        setValue('clientEmail', draft.client.email ?? '', { shouldDirty: true });
        setValue('clientPhone', draft.client.phone ?? '', { shouldDirty: true });
        setValue('clientAddress', draft.client.address ?? '', { shouldDirty: true });
        setValue('clientFiscalRegion', draft.client.fiscalRegion ?? 'NONE', { shouldDirty: true });
        setValue('clientSiret', draft.client.siret ?? '', { shouldDirty: true });
        setValue('clientVatNumber', draft.client.vatNumber ?? '', { shouldDirty: true });
        setValue('clientNif', draft.client.nif ?? '', { shouldDirty: true });
        setValue('clientStat', draft.client.stat ?? '', { shouldDirty: true });
      }
    }
    if (draft.currency) setValue('currency', draft.currency, { shouldDirty: true });
    if (draft.documentDate) setValue('documentDate', draft.documentDate, { shouldDirty: true });
    if (draft.secondDate) setValue('secondDate', draft.secondDate, { shouldDirty: true });
    if (draft.taxMode) {
      setValue('taxMode', draft.taxMode, { shouldDirty: true });
      setValue('taxRate', draft.taxMode === 'none' ? '0' : (draft.taxRate ?? '0'), {
        shouldDirty: true,
      });
    }
    if (draft.paymentMethod) {
      setValue('paymentMethod', normalizePaymentMethod(draft.paymentMethod), { shouldDirty: true });
    }
    if (draft.notes) setValue('notes', draft.notes, { shouldDirty: true });
    if (draft.items.length) replace(draft.items);
    clearErrors();
    setStep(0);
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
      {desktopPreview ? (
        <DocumentPreview
          invoice={invoice}
          initial={initial}
          companies={companies}
          clients={clients}
          values={values}
          calculation={calculation}
          locale={locale}
          pendingAction={submissionAction}
          onEdit={() => setDesktopPreview(false)}
          onAction={runAction}
        />
      ) : null}
      <div className={desktopPreview ? 'sm:hidden' : ''}>
        <Link
          href={`/${locale}/${collection}`}
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
        >
          <ArrowLeft className="size-4" /> Retour
        </Link>
        <div className="mt-5">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {initial ? 'Modifier' : 'Créer'} {invoice ? 'une facture' : 'un devis'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Remplissez les informations puis vérifiez le document avant de l’enregistrer.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(() => setDesktopPreview(true))}
          className="mt-8 space-y-5"
          noValidate
        >
          {!initial ? (
            <DocumentAiImport
              kind={kind}
              disabled={isSubmitting}
              onImported={applyImportedDocument}
            />
          ) : null}
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
                    setLocalStorageError(null);
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
                    if (ownerId) void deleteEncryptedDraft(ownerId, kind);
                    setSavedDraft(null);
                  }}
                  className="text-blue-700"
                >
                  Ignorer
                </button>
              </div>
            </div>
          ) : null}
          {queuedJob ? (
            <div
              role="status"
              className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <strong className="block">
                  {queuedJob.blocked ? 'Synchronisation à corriger' : 'Synchronisation en attente'}
                </strong>
                {queuedJob.blocked
                  ? 'Le serveur a refusé ce document. Annulez l’envoi, corrigez les informations puis réessayez.'
                  : 'Le document est chiffré sur cet appareil et sera synchronisé automatiquement. Annulez l’envoi avant de modifier son contenu.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  void deleteDocumentJob(queuedJob.id).then(() => {
                    queuedJobId.current = null;
                    idempotencyKey.current = crypto.randomUUID();
                    setQueuedJob(null);
                    setSubmitError(null);
                  });
                }}
                className="font-semibold underline"
              >
                Annuler l’envoi
              </button>
            </div>
          ) : null}
          {syncedDocumentId ? (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <strong className="block">Document synchronisé</strong>
                Les données ont bien été enregistrées sur le serveur. Ouvrez le document pour
                continuer ou télécharger son PDF.
              </span>
              <Link
                href={`/${locale}/${collection}/${syncedDocumentId}`}
                className="font-semibold underline"
              >
                Ouvrir
              </Link>
            </div>
          ) : null}
          {localStorageError ? (
            <p
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {localStorageError}
            </p>
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
                  setLocalStorageError(null);
                  if (!event.target.checked && ownerId) {
                    void deleteEncryptedDraft(ownerId, kind);
                  }
                  localStorage.removeItem(draftKey);
                }}
                className="mt-0.5 size-4 accent-blue-700"
              />
              <span>
                <strong className="block text-slate-900">
                  Sauvegarder ce brouillon chiffré sur cet appareil
                </strong>
                Les données restent dans ce navigateur pendant 30 jours au maximum, jusqu’à
                l’enregistrement ou la déconnexion.
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
              {isSubmitting
                ? 'Vérification…'
                : `Prévisualiser ${invoice ? 'la facture' : 'le devis'}`}
            </button>
          </div>
        </form>
      </div>
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
