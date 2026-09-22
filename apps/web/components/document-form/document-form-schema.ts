import type { SupportedCurrency } from '@factumation/domain';
import { z } from 'zod';

import type { Company, Invoice, Quote } from '@/lib/api/types';

const decimal = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/;
const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const documentFormSchema = z
  .object({
    companyId: z.union([z.literal(''), z.string().uuid('Sélectionnez une entreprise.')]),
    clientMode: z.enum(['existing', 'new', 'snapshot']),
    clientId: z.string(),
    clientName: optionalText(160),
    clientCompanyName: optionalText(160),
    clientEmail: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide.')]),
    clientPhone: optionalText(50),
    clientAddress: optionalText(500),
    clientFiscalRegion: z.enum(['NONE', 'EU', 'MG']),
    clientSiret: optionalText(14),
    clientVatNumber: optionalText(30),
    clientNif: optionalText(50),
    clientStat: optionalText(50),
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
            .refine((value) => Number(value) > 0, 'La quantité doit être positive.'),
          unitPrice: z.string().regex(decimal, 'Prix invalide.'),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, context) => {
    if (value.clientMode === 'existing' && !z.string().uuid().safeParse(value.clientId).success) {
      context.addIssue({
        code: 'custom',
        path: ['clientId'],
        message: 'Sélectionnez un client.',
      });
    }
    if (value.clientMode === 'new') {
      if (!value.clientName) {
        context.addIssue({ code: 'custom', path: ['clientName'], message: 'Le nom est requis.' });
      }
      if (!value.clientEmail) {
        context.addIssue({
          code: 'custom',
          path: ['clientEmail'],
          message: 'L’e-mail est requis.',
        });
      }
    }
    if (value.secondDate < value.documentDate) {
      context.addIssue({
        code: 'custom',
        path: ['secondDate'],
        message: 'Cette date doit être postérieure à la date du document.',
      });
    }
    if (value.taxMode === 'none' && value.taxRate !== '0') {
      context.addIssue({
        code: 'custom',
        path: ['taxRate'],
        message: 'Le taux doit être égal à 0 sans taxe.',
      });
    }
    if (Number(value.taxRate) > 100) {
      context.addIssue({
        code: 'custom',
        path: ['taxRate'],
        message: 'Le taux ne peut pas dépasser 100 %.',
      });
    }
  });

export type DocumentFormValues = z.infer<typeof documentFormSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inThirtyDays(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function createDocumentDefaultValues(
  companies: Company[],
  initial?: Invoice | Quote,
): DocumentFormValues {
  const initialClientMode = initial?.clientId ? 'existing' : initial ? 'snapshot' : 'existing';
  return {
    companyId:
      initial?.companyId ??
      companies.find((company) => company.isDefault)?.id ??
      companies[0]?.id ??
      '',
    clientMode: initialClientMode,
    clientId: initial?.clientId ?? '',
    clientName: initial?.clientName ?? '',
    clientCompanyName: '',
    clientEmail: initial?.clientEmail ?? '',
    clientPhone: initial?.clientPhone ?? '',
    clientAddress: initial?.clientAddress ?? '',
    clientFiscalRegion: 'NONE',
    clientSiret: '',
    clientVatNumber: '',
    clientNif: '',
    clientStat: '',
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
  };
}

export const clientStepFields: Array<keyof DocumentFormValues> = [
  'companyId',
  'clientMode',
  'clientId',
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

export const billingStepFields: Array<keyof DocumentFormValues> = [
  'documentDate',
  'secondDate',
  'currency',
  'taxMode',
  'taxRate',
  'paymentMethod',
  'notes',
];
