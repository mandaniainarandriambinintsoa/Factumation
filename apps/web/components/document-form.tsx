'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { calculateDocument, type SupportedCurrency, type TaxMode } from '@factumation/domain';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';
import type { Client, Company, Invoice, Quote } from '@/lib/api/types';
import { formatMoney } from '@/lib/format';

const decimal = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/;
const schema = z
  .object({
    companyId: z.string().uuid('Sélectionnez une entreprise.'),
    clientId: z.string().uuid('Sélectionnez un client.'),
    currency: z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA']),
    documentDate: z.string().min(1, 'La date est requise.'),
    secondDate: z.string().min(1, 'La date est requise.'),
    taxMode: z.enum(['none', 'vat', 'withholding']),
    taxRate: z.string().regex(decimal, 'Taux invalide.'),
    paymentMethod: z.string().max(100),
    notes: z.string().max(2000),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, 'Description requise.').max(500),
          quantity: z
            .string()
            .regex(decimal, 'Quantité invalide.')
            .refine((v) => Number(v) > 0, 'La quantité doit être positive.'),
          unitPrice: z.string().regex(decimal, 'Prix invalide.'),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, context) => {
    if (value.secondDate < value.documentDate)
      context.addIssue({
        code: 'custom',
        path: ['secondDate'],
        message: 'Cette date doit être postérieure à la date du document.',
      });
    if (value.taxMode === 'none' && value.taxRate !== '0')
      context.addIssue({
        code: 'custom',
        path: ['taxRate'],
        message: 'Le taux doit être égal à 0 sans taxe.',
      });
    if (Number(value.taxRate) > 100)
      context.addIssue({
        code: 'custom',
        path: ['taxRate'],
        message: 'Le taux ne peut pas dépasser 100 %.',
      });
  });

type FormValues = z.infer<typeof schema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function inThirtyDays(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saveLocal, setSaveLocal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<FormValues | null>(null);
  const draftKey = `factumation-document-draft-v1-${kind}`;
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId:
        initial?.companyId ??
        companies.find((company) => company.isDefault)?.id ??
        companies[0]?.id ??
        '',
      clientId: initial?.clientId ?? '',
      currency:
        (initial?.currency as SupportedCurrency | undefined) ??
        (companies.find((company) => company.isDefault)?.defaultCurrency as
          SupportedCurrency | undefined) ??
        'EUR',
      documentDate: initial
        ? 'invoiceDate' in initial
          ? initial.invoiceDate
          : initial.quoteDate
        : today(),
      secondDate: initial
        ? 'dueDate' in initial
          ? (initial.dueDate ?? initial.invoiceDate)
          : initial.validityDate
        : inThirtyDays(),
      taxMode: initial?.taxMode ?? 'none',
      taxRate: initial?.taxRate ?? '0',
      paymentMethod: initial?.paymentMethod ?? '',
      notes: initial?.notes ?? '',
      items: initial?.items.map(({ description, quantity, unitPrice }) => ({
        description,
        quantity,
        unitPrice,
      })) ?? [{ description: '', quantity: '1', unitPrice: '0' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const values = watch();
  useEffect(() => {
    if (initial) return;
    try {
      const stored = localStorage.getItem(draftKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { version?: number; kind?: string; values?: unknown };
      const validated = schema.safeParse(parsed.values);
      if (parsed.version === 1 && parsed.kind === kind && validated.success)
        setSavedDraft(validated.data);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, initial, kind]);
  useEffect(() => {
    if (initial || !saveLocal) return;
    const subscription = watch((next) => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ version: 1, kind, savedAt: new Date().toISOString(), values: next }),
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
  const fieldClass =
    'focus-ring mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400';
  const labelClass = 'text-sm font-medium text-slate-700';
  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    const payload = {
      companyId: data.companyId,
      clientId: data.clientId,
      items: data.items,
      currency: data.currency,
      ...(invoice
        ? { invoiceDate: data.documentDate, dueDate: data.secondDate }
        : { quoteDate: data.documentDate, validityDate: data.secondDate }),
      taxMode: data.taxMode,
      taxRate: data.taxRate,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    };
    try {
      const saved = await browserApiRequest<Invoice | Quote>(
        initial ? `/${collection}/${initial.id}` : `/${collection}`,
        {
          method: initial ? 'PATCH' : 'POST',
          ...(!initial ? { headers: { 'Idempotency-Key': idempotencyKey.current } } : {}),
          body: JSON.stringify(
            initial
              ? {
                  items: data.items,
                  currency: data.currency,
                  ...(invoice
                    ? { invoiceDate: data.documentDate, dueDate: data.secondDate }
                    : { quoteDate: data.documentDate, validityDate: data.secondDate }),
                  taxMode: data.taxMode,
                  taxRate: data.taxRate,
                  paymentMethod: data.paymentMethod || null,
                  notes: data.notes || null,
                }
              : payload,
          ),
        },
      );
      localStorage.removeItem(draftKey);
      router.push(`/${locale}/${collection}/${saved.id}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof BrowserApiError
          ? `${error.message}${error.requestId ? ` (référence ${error.requestId})` : ''}`
          : 'Une erreur inattendue est survenue.',
      );
    }
  };
  if (!companies.length)
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
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <Link
        href={`/${locale}/${collection}`}
        className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-[var(--primary-900)]"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--primary-600)]">
          {initial ? 'Brouillon' : 'Nouveau document'}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {initial ? 'Modifier' : 'Créer'} {invoice ? 'une facture' : 'un devis'}
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="sm:hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Étape {step + 1} sur 3</span>
            <span>{['Informations', 'Prestations', 'Finalisation'][step]}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--primary-600)] transition-all"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </div>
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
                  setSavedDraft(null);
                }}
                className="text-blue-700"
              >
                Ignorer
              </button>
            </div>
          </div>
        ) : null}
        <section
          className={`${step === 0 ? 'grid' : 'hidden'} gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid sm:grid-cols-2 sm:p-6`}
        >
          <label className={labelClass}>
            Entreprise
            {initial ? (
              <>
                <input type="hidden" {...register('companyId')} />
                <span className={`${fieldClass} flex items-center bg-slate-100`}>
                  {companies.find((company) => company.id === initial.companyId)?.name ??
                    'Entreprise'}
                </span>
              </>
            ) : (
              <select {...register('companyId')} className={fieldClass}>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
            <FieldError text={errors.companyId?.message} />
          </label>
          <label className={labelClass}>
            Client
            {initial ? (
              <>
                <input type="hidden" {...register('clientId')} />
                <span className={`${fieldClass} flex items-center bg-slate-100`}>
                  {clients.find((client) => client.id === initial.clientId)?.name ?? 'Client'}
                </span>
              </>
            ) : (
              <select {...register('clientId')} className={fieldClass}>
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.companyName ? ` — ${client.companyName}` : ''}
                  </option>
                ))}
              </select>
            )}
            <FieldError text={errors.clientId?.message} />
            {!clients.length ? (
              <span className="mt-2 block text-xs text-amber-700">
                Aucun client.{' '}
                <Link className="underline" href={`/${locale}/clients/new`}>
                  Ajoutez-en un
                </Link>
                .
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            Date du {invoice ? 'document' : 'devis'}
            <input type="date" {...register('documentDate')} className={fieldClass} />
            <FieldError text={errors.documentDate?.message} />
          </label>
          <label className={labelClass}>
            {invoice ? 'Date d’échéance' : 'Valable jusqu’au'}
            <input type="date" {...register('secondDate')} className={fieldClass} />
            <FieldError text={errors.secondDate?.message} />
          </label>
        </section>
        <section
          className={`${step === 1 ? 'block' : 'hidden'} rounded-xl border border-slate-200 bg-white p-5 sm:block sm:p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Prestations</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ajoutez les produits ou services facturés.
              </p>
            </div>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: '1', unitPrice: '0' })}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="size-4" />
              Ajouter
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_7rem_10rem_2.5rem] sm:items-start"
              >
                <label className={labelClass}>
                  Description
                  <input
                    {...register(`items.${index}.description`)}
                    placeholder="Conseil, prestation…"
                    className={fieldClass}
                  />
                  <FieldError text={errors.items?.[index]?.description?.message} />
                </label>
                <label className={labelClass}>
                  Quantité
                  <input
                    inputMode="decimal"
                    {...register(`items.${index}.quantity`)}
                    className={fieldClass}
                  />
                  <FieldError text={errors.items?.[index]?.quantity?.message} />
                </label>
                <label className={labelClass}>
                  Prix unitaire
                  <input
                    inputMode="decimal"
                    {...register(`items.${index}.unitPrice`)}
                    className={fieldClass}
                  />
                  <FieldError text={errors.items?.[index]?.unitPrice?.message} />
                </label>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Supprimer cette ligne"
                  className="focus-ring mt-7 grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section
          className={`${step === 2 ? 'grid' : 'hidden'} gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid sm:grid-cols-3 sm:p-6`}
        >
          <label className={labelClass}>
            Devise
            <select {...register('currency')} className={fieldClass}>
              {['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'].map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Taxe
            <select
              {...register('taxMode')}
              onChange={(event) => {
                const mode = event.target.value as TaxMode;
                setValue('taxMode', mode);
                if (mode === 'none') setValue('taxRate', '0');
              }}
              className={fieldClass}
            >
              <option value="none">Aucune</option>
              <option value="vat">TVA</option>
              <option value="withholding">Retenue à la source</option>
            </select>
          </label>
          <label className={labelClass}>
            Taux (%)
            <input
              inputMode="decimal"
              disabled={values.taxMode === 'none'}
              {...register('taxRate')}
              className={`${fieldClass} disabled:bg-slate-100`}
            />
            <FieldError text={errors.taxRate?.message} />
          </label>
          <label className={`${labelClass} sm:col-span-3`}>
            Mode de paiement
            <input
              {...register('paymentMethod')}
              placeholder="Virement bancaire"
              className={fieldClass}
            />
          </label>
          <label className={`${labelClass} sm:col-span-3`}>
            Notes
            <textarea
              {...register('notes')}
              rows={4}
              className="focus-ring mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900"
            />
          </label>
        </section>
        <section
          className={`${step === 2 ? 'block' : 'hidden'} ml-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 text-sm sm:block`}
        >
          <div className="flex justify-between">
            <span className="text-slate-500">Sous-total</span>
            <span>
              {calculation ? formatMoney(calculation.subtotal, values.currency, locale) : '—'}
            </span>
          </div>
          {values.taxMode === 'vat' ? (
            <div className="mt-2 flex justify-between">
              <span className="text-slate-500">TVA</span>
              <span>
                {calculation ? formatMoney(calculation.taxAmount, values.currency, locale) : '—'}
              </span>
            </div>
          ) : null}
          {values.taxMode === 'withholding' ? (
            <div className="mt-2 flex justify-between">
              <span className="text-slate-500">Retenue</span>
              <span>
                {calculation
                  ? `- ${formatMoney(calculation.withholdingAmount, values.currency, locale)}`
                  : '—'}
              </span>
            </div>
          ) : null}
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Net à payer</span>
            <span>
              {calculation ? formatMoney(calculation.amountDue, values.currency, locale) : '—'}
            </span>
          </div>
        </section>
        {!initial ? (
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
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
          {step < 2 ? (
            <button
              type="button"
              onClick={async () => {
                const valid =
                  step === 0
                    ? await trigger(['companyId', 'clientId', 'documentDate', 'secondDate'])
                    : await trigger('items');
                if (valid) setStep((current) => Math.min(2, current + 1));
              }}
              className="focus-ring ml-auto rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white sm:hidden"
            >
              Continuer
            </button>
          ) : null}
          <button
            disabled={isSubmitting || !clients.length}
            className={`${step === 2 ? 'inline-flex' : 'hidden'} focus-ring min-w-40 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50 sm:inline-flex`}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le brouillon'}
          </button>
        </div>
      </form>
    </main>
  );
}

function FieldError({ text }: { text?: string | undefined }) {
  return text ? <span className="mt-1 block text-xs text-red-600">{text}</span> : null;
}
