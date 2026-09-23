import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const readinessStatusSchema = healthStatusSchema.extend({
  dependencies: z.object({
    auth: z.literal('up'),
    dataApi: z.literal('up'),
  }),
});

export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;

export const problemDetailsSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string().min(1),
  instance: z.string().min(1),
  requestId: z.string().min(1),
  errors: z.array(z.string()).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export const documentKindSchema = z.enum(['invoice', 'quote']);
export type DocumentKind = z.infer<typeof documentKindSchema>;

const nullableText = (maximum: number) => z.string().trim().max(maximum).nullable();
const nullableDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]);
const nullableDecimal = z.union([z.string().regex(/^\d+(?:\.\d{1,4})?$/), z.null()]);

export const documentImportDraftSchema = z.object({
  kind: documentKindSchema.nullable(),
  client: z.object({
    name: nullableText(160),
    companyName: nullableText(160),
    email: nullableText(320),
    phone: nullableText(50),
    address: nullableText(500),
    fiscalRegion: z.enum(['NONE', 'EU', 'MG']).nullable(),
    siret: nullableText(14),
    vatNumber: nullableText(30),
    nif: nullableText(50),
    stat: nullableText(50),
  }),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA']).nullable(),
  documentDate: nullableDate,
  secondDate: nullableDate,
  taxMode: z.enum(['none', 'vat', 'withholding']).nullable(),
  taxRate: nullableDecimal,
  paymentMethod: nullableText(100),
  notes: nullableText(2_000),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.string().regex(/^\d+(?:\.\d{1,4})?$/),
        unitPrice: z.string().regex(/^\d+(?:\.\d{1,4})?$/),
      }),
    )
    .max(100),
});

export type DocumentImportDraft = z.infer<typeof documentImportDraftSchema>;

export const documentImportResponseSchema = z.object({
  source: z.enum(['image', 'voice']),
  draft: documentImportDraftSchema,
  transcript: z.string().trim().max(10_000).nullable(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().trim().min(1).max(300)).max(20),
});

export type DocumentImportResponse = z.infer<typeof documentImportResponseSchema>;
