import type { DocumentCalculation } from '@factumation/domain';
import { ArrowLeft, Download, Loader2, Mail } from 'lucide-react';

import type { Client, Company, Invoice, Quote } from '@/lib/api/types';
import { paymentMethodLabel } from '@/lib/document-options';
import { formatMoney } from '@/lib/format';

import type { SubmissionAction } from './document-action-step';
import type { DocumentFormValues } from './document-form-schema';

export function DocumentPreview({
  invoice,
  initial,
  companies,
  clients,
  values,
  calculation,
  locale,
  pendingAction,
  onEdit,
  onAction,
}: {
  invoice: boolean;
  initial?: Invoice | Quote | undefined;
  companies: Company[];
  clients: Client[];
  values: DocumentFormValues;
  calculation: DocumentCalculation | null;
  locale: string;
  pendingAction: SubmissionAction | null;
  onEdit: () => void;
  onAction: (action: SubmissionAction) => void;
}) {
  const company = companies.find((entry) => entry.id === values.companyId);
  const savedClient = clients.find((entry) => entry.id === values.clientId);
  const client = resolveClient(values, initial, savedClient);
  const number = initial?.number ?? initial?.draftReference ?? 'Brouillon';
  const disabled = pendingAction !== null;

  return (
    <div className="hidden sm:block">
      <h1 className="text-3xl font-bold text-slate-950">Aperçu</h1>
      <p className="mt-2 text-slate-500">
        Vérifiez les informations avant la génération définitive.
      </p>

      <article className="mt-10 min-h-[720px] rounded-sm border border-slate-200 bg-white px-12 py-14 shadow-[0_18px_55px_rgba(15,23,42,0.08)] lg:px-16">
        <header className="grid grid-cols-2 gap-10 border-b border-slate-200 pb-9">
          <div>
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={`Logo ${company.name}`}
                className="mb-7 h-14 max-w-40 object-contain object-left"
              />
            ) : null}
            <h2 className="text-xl font-bold text-slate-950">
              {company?.name ?? initial?.companyName}
            </h2>
            <ContactLines
              address={company?.address ?? initial?.companyAddress}
              email={company?.email ?? initial?.companyEmail}
              phone={company?.phone ?? initial?.companyPhone}
            />
            <FiscalLines entity={company} />
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-3xl font-light tracking-wide text-slate-900">
                {invoice ? 'FACTURE' : 'DEVIS'}
              </span>
              <strong className="text-xl text-[var(--primary-900)]">{number}</strong>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Date : {formatDate(values.documentDate, locale)}
            </p>
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-950">{client.name || 'Client'}</h3>
              <ContactLines
                address={client.address}
                email={client.email}
                phone={client.phone}
                right
              />
              <FiscalLines entity={client} />
            </div>
          </div>
        </header>

        <div className="mt-10">
          <div className="grid grid-cols-[minmax(0,1fr)_7rem_10rem_9rem] border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Description</span>
            <span className="text-right">Quantité</span>
            <span className="text-right">Prix unitaire</span>
            <span className="text-right">Total</span>
          </div>
          {values.items.map((item, index) => (
            <div
              key={`${item.description}-${index}`}
              className="grid min-h-28 grid-cols-[minmax(0,1fr)_7rem_10rem_9rem] items-start border-b border-slate-200 py-5 text-sm"
            >
              <strong className="pr-5 font-medium text-slate-800">{item.description}</strong>
              <span className="text-right text-slate-600">{item.quantity}</span>
              <span className="text-right text-slate-600">
                {formatMoney(item.unitPrice, values.currency, locale)}
              </span>
              <strong className="text-right text-slate-950">
                {formatMoney(calculation?.items[index]?.total ?? '0', values.currency, locale)}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-16">
          <div className="text-sm text-slate-600">
            <h3 className="font-bold text-slate-950">Informations de paiement</h3>
            <p className="mt-2">Méthode : {paymentMethodLabel(values.paymentMethod)}</p>
            <p>Devise : {values.currency}</p>
            {invoice && values.secondDate ? (
              <p>Échéance : {formatDate(values.secondDate, locale)}</p>
            ) : null}
          </div>
          <div className="space-y-3 text-sm">
            <TotalLine
              label="Sous-total"
              value={formatMoney(calculation?.subtotal ?? '0', values.currency, locale)}
            />
            {values.taxMode === 'vat' ? (
              <TotalLine
                label={`TVA (${values.taxRate} %)`}
                value={formatMoney(calculation?.taxAmount ?? '0', values.currency, locale)}
              />
            ) : null}
            {values.taxMode === 'withholding' ? (
              <TotalLine
                label={`Retenue (${values.taxRate} %)`}
                value={`- ${formatMoney(calculation?.withholdingAmount ?? '0', values.currency, locale)}`}
              />
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-bold text-[var(--primary-900)]">
              <span>Total à payer</span>
              <span>{formatMoney(calculation?.amountDue ?? '0', values.currency, locale)}</span>
            </div>
          </div>
        </div>

        {values.notes ? (
          <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
            <h3 className="font-bold text-slate-950">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap">{values.notes}</p>
          </div>
        ) : null}
      </article>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft className="size-4" /> Modifier
        </button>
        <PreviewAction
          action="pdf"
          label="Enregistrer et télécharger"
          icon={Download}
          pendingAction={pendingAction}
          onAction={onAction}
        />
        <PreviewAction
          action="send"
          label="Envoyer"
          icon={Mail}
          pendingAction={pendingAction}
          onAction={onAction}
        />
      </div>
    </div>
  );
}

function resolveClient(
  values: DocumentFormValues,
  initial: Invoice | Quote | undefined,
  client: Client | undefined,
) {
  if (values.clientMode === 'new') {
    return {
      name: values.clientName,
      address: values.clientAddress,
      email: values.clientEmail,
      phone: values.clientPhone,
      fiscalRegion: values.clientFiscalRegion,
      siret: values.clientSiret,
      vatNumber: values.clientVatNumber,
      nif: values.clientNif,
      stat: values.clientStat,
    };
  }
  if (client) return client;
  return {
    name: initial?.clientName ?? values.clientName,
    address: initial?.clientAddress ?? values.clientAddress,
    email: initial?.clientEmail ?? values.clientEmail,
    phone: initial?.clientPhone ?? values.clientPhone,
    fiscalRegion: 'NONE' as const,
    siret: null,
    vatNumber: null,
    nif: null,
    stat: null,
  };
}

function ContactLines({
  address,
  email,
  phone,
  right = false,
}: {
  address?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  right?: boolean;
}) {
  return (
    <div
      className={`mt-3 whitespace-pre-line text-sm leading-6 text-slate-500 ${right ? 'ml-auto' : ''}`}
    >
      {[address, email, phone].filter(Boolean).map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function FiscalLines({
  entity,
}: {
  entity?:
    | {
        fiscalRegion: string;
        siret?: string | null;
        vatNumber?: string | null;
        nif?: string | null;
        stat?: string | null;
      }
    | undefined;
}) {
  if (!entity) return null;
  return (
    <div className="mt-3 text-sm leading-5 text-slate-600">
      {entity.fiscalRegion === 'EU' ? (
        <>
          <div>SIRET : {entity.siret || '—'}</div>
          <div>TVA : {entity.vatNumber || '—'}</div>
        </>
      ) : null}
      {entity.fiscalRegion === 'MG' ? (
        <>
          <div>NIF : {entity.nif || '—'}</div>
          <div>STAT : {entity.stat || '—'}</div>
        </>
      ) : null}
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-3 text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PreviewAction({
  action,
  label,
  icon: Icon,
  pendingAction,
  onAction,
}: {
  action: SubmissionAction;
  label: string;
  icon: typeof Download;
  pendingAction: SubmissionAction | null;
  onAction: (action: SubmissionAction) => void;
}) {
  const disabled = pendingAction !== null;
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      disabled={disabled}
      className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--primary-900)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-800)] disabled:opacity-50"
    >
      {pendingAction === action ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {label}
    </button>
  );
}

function formatDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale).format(date);
}
