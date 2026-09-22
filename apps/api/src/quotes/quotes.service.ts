import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  calculateDocument,
  formatCurrencyAmount,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  type TaxMode,
} from '@factumation/domain';
import { z } from 'zod';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { DocumentEmailGateway } from '../documents/document-email.gateway.js';
import { renderDocumentPdf, type DocumentPrintModel } from '../documents/document-pdf.js';
import { DocumentStorageGateway } from '../documents/document-storage.gateway.js';
import type { QuoteReadRow, QuoteUpdate } from '../common/supabase/database.types.js';
import type {
  CreateQuoteDto,
  QuoteListQueryDto,
  QuoteListResponseDto,
  QuoteResponseDto,
  UpdateQuoteDto,
} from './dto/quote.dto.js';
import {
  QuoteIdempotencyConflictError,
  QuoteQuotaExceededError,
  QuotesRepository,
  QuoteStateConflictError,
} from './quotes.repository.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const quoteItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    quantity: z.union([z.string(), z.number()]),
    unitPrice: z.union([z.string(), z.number()]),
    total: z.union([z.string(), z.number()]).optional(),
  })
  .refine((item) => item.description !== undefined || item.name !== undefined, {
    message: 'A quote item description is required.',
  });
const quoteItemsSchema = z.array(quoteItemSchema).min(1).max(100);

type EditableQuote = {
  items: CreateQuoteDto['items'];
  currency: CreateQuoteDto['currency'];
  quoteDate: string;
  validityDate: string;
  taxMode: CreateQuoteDto['taxMode'];
  taxRate: string;
  paymentMethod: string | null;
  notes: string | null;
};

@Injectable()
export class QuotesService {
  constructor(
    @Inject(QuotesRepository) private readonly repository: QuotesRepository,
    @Optional() @Inject(DocumentEmailGateway) private readonly emails?: DocumentEmailGateway,
    @Optional() @Inject(DocumentStorageGateway) private readonly storage?: DocumentStorageGateway,
  ) {}

  async list(
    principal: AuthPrincipal,
    accessToken: string,
    query: QuoteListQueryDto,
  ): Promise<QuoteListResponseDto> {
    try {
      const result = await this.repository.list({
        accessToken,
        ownerId: principal.id,
        page: query.page,
        limit: query.limit,
        ...(query.status ? { status: query.status } : {}),
        ...(principal.allowedCompanyIds?.length
          ? { allowedCompanyIds: principal.allowedCompanyIds }
          : {}),
      });
      return {
        items: result.rows.map((row) => this.toResponse(row)),
        page: query.page,
        limit: query.limit,
        total: result.total,
      };
    } catch {
      throw new InternalServerErrorException('Unable to load quotes.');
    }
  }

  async findOne(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<QuoteResponseDto> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Quote not found.');
      this.assertAllowedCompany(principal, row.company_id);
      return this.toResponse(row);
    } catch (error) {
      this.rethrowHttp(error, 'Unable to load the quote.');
    }
  }

  async renderPdf(principal: AuthPrincipal, accessToken: string, id: string): Promise<Uint8Array> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Quote not found.');
      this.assertAllowedCompany(principal, row.company_id);
      const model = this.toPrintModel(row);
      if (row.status === 'draft' || !this.storage) return renderDocumentPdf(model);
      return this.storage.getOrStore(accessToken, principal.id, 'quote', id, () =>
        renderDocumentPdf(model),
      );
    } catch (error) {
      this.rethrowHttp(error, 'Unable to render the quote PDF.');
    }
  }

  async send(principal: AuthPrincipal, accessToken: string, id: string): Promise<QuoteResponseDto> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Quote not found.');
      if (row.status !== 'issued') throw new ConflictException('Only an issued quote can be sent.');
      if (!(await this.repository.hasEmailEntitlement(accessToken, principal.id)))
        throw new ForbiddenException('Email sending requires an active Pro or Business plan.');
      if (!this.emails) throw new InternalServerErrorException('Email service is unavailable.');
      const model = this.toPrintModel(row);
      const pdf = this.storage
        ? await this.storage.getOrStore(accessToken, principal.id, 'quote', id, () =>
            renderDocumentPdf(model),
          )
        : await renderDocumentPdf(model);
      await this.emails.send(accessToken, id, model, pdf);
      const updated = await this.repository.markSent(accessToken, principal.id, id);
      if (!updated) throw new NotFoundException('Quote not found.');
      return this.toResponse(updated);
    } catch (error) {
      if (error instanceof QuoteStateConflictError) throw new ConflictException(error.message);
      this.rethrowHttp(error, 'Unable to send the quote.');
    }
  }

  async create(
    principal: AuthPrincipal,
    accessToken: string,
    idempotencyKey: string | undefined,
    input: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    this.assertIdempotencyKey(idempotencyKey);
    this.assertClientSelection(input);
    const normalized = this.normalizeEditable(input);
    const calculation = this.calculate(normalized);
    const inlineClient = input.client ? this.toInlineClient(input.client) : null;
    const fingerprint = this.fingerprint({
      companyId: input.companyId,
      clientId: input.clientId ?? null,
      client: inlineClient,
      ...normalized,
      calculation,
    });

    try {
      const row = await this.repository.createDraft(accessToken, principal.id, {
        p_company_id: input.companyId,
        p_client_id: input.clientId ?? null,
        p_client: inlineClient,
        p_items: calculation.items.map((item) => ({ ...item, id: randomUUID() })),
        p_currency: input.currency,
        p_quote_date: input.quoteDate,
        p_validity_date: input.validityDate,
        p_tax_mode: input.taxMode,
        p_tax_rate: input.taxRate,
        p_subtotal: calculation.subtotal,
        p_tax_amount: calculation.taxAmount,
        p_withholding_amount: calculation.withholdingAmount,
        p_total: calculation.total,
        p_amount_due: calculation.amountDue,
        p_payment_method: input.paymentMethod || null,
        p_notes: input.notes || null,
        p_idempotency_key: idempotencyKey,
        p_request_fingerprint: fingerprint,
      });
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof QuoteIdempotencyConflictError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof QuoteQuotaExceededError) {
        throw new ForbiddenException(error.message);
      }
      throw new InternalServerErrorException('Unable to create the quote draft.');
    }
  }

  async update(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
    input: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
    try {
      const existing = await this.repository.findById(accessToken, principal.id, id);
      if (!existing) throw new NotFoundException('Quote not found.');
      if (existing.status !== 'draft' || existing.calculation_version !== 'v2') {
        throw new ConflictException('Only v2 quote drafts can be edited.');
      }
      const current = this.toEditable(existing);
      const merged: EditableQuote = {
        ...current,
        ...input,
        paymentMethod:
          input.paymentMethod === undefined ? current.paymentMethod : input.paymentMethod,
        notes: input.notes === undefined ? current.notes : input.notes,
      };
      const calculation = this.calculate(merged);
      const existingItems = this.readItems(existing.items);
      const values: QuoteUpdate = {
        quote_date: merged.quoteDate,
        validity_date: merged.validityDate,
        items: calculation.items.map((item, index) => ({
          ...item,
          id: input.items ? randomUUID() : (existingItems[index]?.id ?? randomUUID()),
        })),
        currency: merged.currency,
        tax_mode: merged.taxMode,
        tax_rate: merged.taxRate,
        subtotal: calculation.subtotal,
        tax_amount: calculation.taxAmount,
        withholding_amount: calculation.withholdingAmount,
        total: calculation.total,
        amount_due: calculation.amountDue,
        payment_method: merged.paymentMethod || null,
        notes: merged.notes || null,
      };
      const updated = await this.repository.updateDraft(accessToken, principal.id, id, values);
      if (!updated) throw new ConflictException('The quote is no longer an editable draft.');
      return this.toResponse(updated);
    } catch (error) {
      this.rethrowHttp(error, 'Unable to update the quote.');
    }
  }

  async issue(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<QuoteResponseDto> {
    try {
      const row = await this.repository.issue(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Quote not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof QuoteStateConflictError) throw new ConflictException(error.message);
      this.rethrowHttp(error, 'Unable to issue the quote.');
    }
  }

  async transition(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
    targetStatus: 'accepted' | 'rejected',
  ): Promise<QuoteResponseDto> {
    try {
      const row = await this.repository.transition(accessToken, principal.id, id, targetStatus);
      if (!row) throw new NotFoundException('Quote not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof QuoteStateConflictError) throw new ConflictException(error.message);
      this.rethrowHttp(error, `Unable to mark the quote as ${targetStatus}.`);
    }
  }

  private assertIdempotencyKey(value: string | undefined): asserts value is string {
    if (!value || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
      throw new BadRequestException(
        'Idempotency-Key must contain 8 to 128 letters, numbers, dots, underscores, colons, or hyphens.',
      );
    }
  }

  private assertAllowedCompany(principal: AuthPrincipal, companyId: string | null): void {
    if (
      principal.allowedCompanyIds?.length &&
      (!companyId || !principal.allowedCompanyIds.includes(companyId))
    )
      throw new NotFoundException('Quote not found.');
  }

  private assertClientSelection(input: CreateQuoteDto): void {
    if ((input.clientId === undefined) === (input.client === undefined)) {
      throw new BadRequestException('Provide exactly one of clientId or client.');
    }
  }

  private toInlineClient(client: NonNullable<CreateQuoteDto['client']>) {
    return {
      name: client.name,
      email: client.email.toLowerCase(),
      address: client.address ?? null,
      phone: client.phone ?? null,
      companyName: client.companyName ?? null,
      fiscalRegion: client.fiscalRegion ?? 'NONE',
      siret: client.siret ?? null,
      vatNumber: client.vatNumber?.toUpperCase() ?? null,
      nif: client.nif ?? null,
      stat: client.stat ?? null,
      notes: client.notes ?? null,
    };
  }

  private calculate(input: EditableQuote) {
    if (input.validityDate < input.quoteDate) {
      throw new BadRequestException('validityDate must be on or after quoteDate.');
    }
    try {
      return calculateDocument(input);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid quote.');
    }
  }

  private normalizeEditable(input: CreateQuoteDto | EditableQuote): EditableQuote {
    return {
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      currency: input.currency,
      quoteDate: input.quoteDate,
      validityDate: input.validityDate,
      taxMode: input.taxMode,
      taxRate: input.taxRate,
      paymentMethod: input.paymentMethod || null,
      notes: input.notes || null,
    };
  }

  private fingerprint(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private toEditable(row: QuoteReadRow): EditableQuote {
    const currency = this.currency(row.currency);
    return {
      items: this.readItems(row.items).map((item) => ({
        description: item.description ?? item.name ?? '',
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
      currency,
      quoteDate: row.quote_date,
      validityDate: row.validity_date,
      taxMode: this.taxMode(row.tax_mode, row.tax_rate),
      taxRate: String(row.tax_rate),
      paymentMethod: row.payment_method,
      notes: row.notes,
    };
  }

  private toResponse(row: QuoteReadRow): QuoteResponseDto {
    const currency = this.currency(row.currency);
    const items = this.readItems(row.items).map((item) => {
      const description = item.description ?? item.name;
      if (!description) throw new Error('Quote item boundary is missing a description.');
      const quantity = String(item.quantity);
      const unitPrice = String(item.unitPrice);
      const total =
        item.total === undefined
          ? calculateDocument({
              currency,
              items: [{ description, quantity, unitPrice }],
              taxMode: 'none',
              taxRate: '0',
            }).items[0]!.total
          : formatCurrencyAmount(item.total, currency);
      return { id: item.id ?? null, description, quantity, unitPrice, total };
    });
    const taxMode = this.taxMode(row.tax_mode, row.tax_rate);
    const legacyCalculation =
      row.calculation_version === 'v2'
        ? null
        : calculateDocument({
            currency,
            items: items.map(({ description, quantity, unitPrice }) => ({
              description,
              quantity,
              unitPrice,
            })),
            taxMode,
            taxRate: String(row.tax_rate),
          });

    return {
      id: row.id,
      draftReference: row.draft_reference,
      number: row.quote_number,
      companyId: row.company_id,
      clientId: row.client_id,
      items,
      currency,
      subtotal: formatCurrencyAmount(row.subtotal ?? row.total, currency),
      taxAmount: formatCurrencyAmount(
        row.tax_amount ?? legacyCalculation?.taxAmount ?? '0',
        currency,
      ),
      withholdingAmount: formatCurrencyAmount(
        row.withholding_amount ?? legacyCalculation?.withholdingAmount ?? '0',
        currency,
      ),
      total: formatCurrencyAmount(row.total, currency),
      amountDue: formatCurrencyAmount(
        row.amount_due ?? legacyCalculation?.amountDue ?? row.total,
        currency,
      ),
      taxRate: String(row.tax_rate),
      taxMode,
      calculationVersion: row.calculation_version === 'v2' ? 'v2' : 'legacy-v1',
      status: row.status ?? 'draft',
      quoteDate: row.quote_date,
      validityDate: row.validity_date,
      paymentMethod: row.payment_method,
      notes: row.notes,
      issuedAt: row.issued_at,
      createdAt: this.requiredTimestamp(row.created_at, 'created_at'),
      updatedAt: this.requiredTimestamp(row.updated_at ?? row.created_at, 'updated_at'),
    };
  }

  private toPrintModel(row: QuoteReadRow): DocumentPrintModel {
    const document = this.toResponse(row);
    return {
      kind: 'quote',
      number: document.number,
      draftReference: document.draftReference,
      status: document.status,
      companyName: row.company_name,
      companyAddress: row.company_address,
      companyEmail: row.company_email,
      companyPhone: row.company_phone,
      clientName: row.client_name,
      clientAddress: row.client_address,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      documentDate: document.quoteDate,
      secondDate: document.validityDate,
      currency: document.currency,
      items: document.items,
      subtotal: document.subtotal,
      taxMode: document.taxMode,
      taxRate: document.taxRate,
      taxAmount: document.taxAmount,
      withholdingAmount: document.withholdingAmount,
      amountDue: document.amountDue,
      paymentMethod: document.paymentMethod,
      notes: document.notes,
    };
  }

  private readItems(value: unknown): z.infer<typeof quoteItemsSchema> {
    return quoteItemsSchema.parse(value);
  }

  private currency(value: string): SupportedCurrency {
    if (!SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
      throw new Error(`Unsupported quote currency: ${value}.`);
    }
    return value as SupportedCurrency;
  }

  private taxMode(value: string | null, rate: string | number): TaxMode {
    if (value === 'none' || value === 'vat' || value === 'withholding') return value;
    return Number(rate) > 0 ? 'withholding' : 'none';
  }

  private requiredTimestamp(value: string | null, field: string): string {
    if (!value) throw new Error(`Quote boundary is missing ${field}.`);
    return value;
  }

  private rethrowHttp(error: unknown, fallback: string): never {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException(fallback);
  }
}
