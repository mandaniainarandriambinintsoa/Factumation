import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
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
import type { InvoiceReadRow, InvoiceUpdate } from '../common/supabase/database.types.js';
import {
  IdempotencyConflictError,
  InvoicesRepository,
  InvoiceQuotaExceededError,
  InvoiceStateConflictError,
} from './invoices.repository.js';
import type {
  CreateInvoiceDto,
  InvoiceListQueryDto,
  InvoiceListResponseDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const invoiceItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    quantity: z.union([z.string(), z.number()]),
    unitPrice: z.union([z.string(), z.number()]),
    total: z.union([z.string(), z.number()]).optional(),
  })
  .refine((item) => item.description !== undefined || item.name !== undefined, {
    message: 'An invoice item description is required.',
  });
const invoiceItemsSchema = z.array(invoiceItemSchema).min(1).max(100);

type EditableInvoice = {
  items: CreateInvoiceDto['items'];
  currency: CreateInvoiceDto['currency'];
  invoiceDate: string;
  dueDate: string | null;
  taxMode: CreateInvoiceDto['taxMode'];
  taxRate: string;
  paymentMethod: string | null;
  notes: string | null;
};

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(InvoicesRepository) private readonly repository: InvoicesRepository,
    @Optional() @Inject(DocumentEmailGateway) private readonly emails?: DocumentEmailGateway,
    @Optional() @Inject(DocumentStorageGateway) private readonly storage?: DocumentStorageGateway,
  ) {}

  async list(
    principal: AuthPrincipal,
    accessToken: string,
    query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
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
      throw new InternalServerErrorException('Unable to load invoices.');
    }
  }

  async findOne(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Invoice not found.');
      this.assertAllowedCompany(principal, row.company_id);
      return this.toResponse(row);
    } catch (error) {
      this.rethrowHttp(error, 'Unable to load the invoice.');
    }
  }

  async renderPdf(principal: AuthPrincipal, accessToken: string, id: string): Promise<Uint8Array> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Invoice not found.');
      this.assertAllowedCompany(principal, row.company_id);
      const model = this.toPrintModel(row);
      if (row.status === 'draft' || !this.storage) return renderDocumentPdf(model);
      return this.storage.getOrStore(accessToken, principal.id, 'invoice', id, () =>
        renderDocumentPdf(model),
      );
    } catch (error) {
      this.rethrowHttp(error, 'Unable to render the invoice PDF.');
    }
  }

  async send(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const row = await this.repository.findById(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Invoice not found.');
      if (row.status !== 'issued')
        throw new ConflictException('Only an issued invoice can be sent.');
      if (!(await this.repository.hasEmailEntitlement(accessToken, principal.id)))
        throw new ForbiddenException('Email sending requires an active Pro or Business plan.');
      if (!this.emails) throw new InternalServerErrorException('Email service is unavailable.');
      const model = this.toPrintModel(row);
      const pdf = this.storage
        ? await this.storage.getOrStore(accessToken, principal.id, 'invoice', id, () =>
            renderDocumentPdf(model),
          )
        : await renderDocumentPdf(model);
      await this.emails.send(accessToken, id, model, pdf);
      const updated = await this.repository.markSent(accessToken, principal.id, id);
      if (!updated) throw new NotFoundException('Invoice not found.');
      return this.toResponse(updated);
    } catch (error) {
      if (error instanceof InvoiceStateConflictError) throw new ConflictException(error.message);
      this.rethrowHttp(error, 'Unable to send the invoice.');
    }
  }

  async markPaid(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const row = await this.repository.markPaid(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Invoice not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof InvoiceStateConflictError) throw new ConflictException(error.message);
      this.rethrowHttp(error, 'Unable to mark the invoice paid.');
    }
  }

  async create(
    principal: AuthPrincipal,
    accessToken: string,
    idempotencyKey: string | undefined,
    input: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
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
    const storedItems = calculation.items.map((item) => ({ ...item, id: randomUUID() }));

    try {
      const row = await this.repository.createDraft(accessToken, principal.id, {
        p_company_id: input.companyId,
        p_client_id: input.clientId ?? null,
        p_client: inlineClient,
        p_items: storedItems,
        p_currency: input.currency,
        p_invoice_date: input.invoiceDate,
        p_due_date: input.dueDate ?? null,
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
      if (error instanceof IdempotencyConflictError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof InvoiceQuotaExceededError) {
        throw new ForbiddenException(error.message);
      }
      throw new InternalServerErrorException('Unable to create the invoice draft.');
    }
  }

  async update(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
    input: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one field is required.');
    }

    try {
      const existing = await this.repository.findById(accessToken, principal.id, id);
      if (!existing) throw new NotFoundException('Invoice not found.');
      if (existing.status !== 'draft' || existing.calculation_version !== 'v2') {
        throw new ConflictException('Only v2 invoice drafts can be edited.');
      }

      const current = this.toEditable(existing);
      const merged: EditableInvoice = {
        ...current,
        ...input,
        dueDate: input.dueDate === undefined ? current.dueDate : input.dueDate,
        paymentMethod:
          input.paymentMethod === undefined ? current.paymentMethod : input.paymentMethod,
        notes: input.notes === undefined ? current.notes : input.notes,
      };
      const calculation = this.calculate(merged);
      const existingItems = this.readItems(existing.items);
      const values: InvoiceUpdate = {
        invoice_date: merged.invoiceDate,
        due_date: merged.dueDate ?? null,
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
      if (!updated) throw new ConflictException('The invoice is no longer an editable draft.');
      return this.toResponse(updated);
    } catch (error) {
      this.rethrowHttp(error, 'Unable to update the invoice.');
    }
  }

  async issue(
    principal: AuthPrincipal,
    accessToken: string,
    id: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const row = await this.repository.issue(accessToken, principal.id, id);
      if (!row) throw new NotFoundException('Invoice not found.');
      return this.toResponse(row);
    } catch (error) {
      if (error instanceof InvoiceStateConflictError) {
        throw new ConflictException(error.message);
      }
      this.rethrowHttp(error, 'Unable to issue the invoice.');
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
      throw new NotFoundException('Invoice not found.');
  }

  private assertClientSelection(input: CreateInvoiceDto): void {
    if ((input.clientId === undefined) === (input.client === undefined)) {
      throw new BadRequestException('Provide exactly one of clientId or client.');
    }
  }

  private toInlineClient(client: NonNullable<CreateInvoiceDto['client']>) {
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

  private calculate(input: EditableInvoice) {
    if (input.dueDate !== null && input.dueDate < input.invoiceDate) {
      throw new BadRequestException('dueDate must be on or after invoiceDate.');
    }
    try {
      return calculateDocument(input);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid invoice.');
    }
  }

  private normalizeEditable(input: CreateInvoiceDto | EditableInvoice): EditableInvoice {
    return {
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      currency: input.currency,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate ?? null,
      taxMode: input.taxMode,
      taxRate: input.taxRate,
      paymentMethod: input.paymentMethod || null,
      notes: input.notes || null,
    };
  }

  private fingerprint(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private toEditable(row: InvoiceReadRow): EditableInvoice {
    const currency = this.currency(row.currency);
    const taxMode = this.taxMode(row.tax_mode, row.tax_rate);
    return {
      items: this.readItems(row.items).map((item) => ({
        description: item.description ?? item.name ?? '',
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
      currency,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      taxMode,
      taxRate: String(row.tax_rate),
      paymentMethod: row.payment_method,
      notes: row.notes,
    };
  }

  private toResponse(row: InvoiceReadRow): InvoiceResponseDto {
    const currency = this.currency(row.currency);
    const rawItems = this.readItems(row.items);
    const items = rawItems.map((item) => {
      const description = item.description ?? item.name;
      if (!description) throw new Error('Invoice item boundary is missing a description.');
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
      number: row.invoice_number,
      companyId: row.company_id,
      clientId: row.client_id,
      companyName: row.company_name,
      companyAddress: row.company_address,
      companyEmail: row.company_email,
      companyPhone: row.company_phone,
      clientName: row.client_name,
      clientAddress: row.client_address,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
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
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      paymentMethod: row.payment_method,
      notes: row.notes,
      issuedAt: row.issued_at,
      createdAt: this.requiredTimestamp(row.created_at, 'created_at'),
      updatedAt: this.requiredTimestamp(row.updated_at ?? row.created_at, 'updated_at'),
    };
  }

  private toPrintModel(row: InvoiceReadRow): DocumentPrintModel {
    const document = this.toResponse(row);
    return {
      kind: 'invoice',
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
      documentDate: document.invoiceDate,
      secondDate: document.dueDate,
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

  private readItems(value: unknown): z.infer<typeof invoiceItemsSchema> {
    return invoiceItemsSchema.parse(value);
  }

  private currency(value: string): SupportedCurrency {
    if (!SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
      throw new Error(`Unsupported invoice currency: ${value}.`);
    }
    return value as SupportedCurrency;
  }

  private taxMode(value: string | null, rate: string | number): TaxMode {
    if (value === 'none' || value === 'vat' || value === 'withholding') return value;
    return Number(rate) > 0 ? 'withholding' : 'none';
  }

  private requiredTimestamp(value: string | null, field: string): string {
    if (!value) throw new Error(`Invoice boundary is missing ${field}.`);
    return value;
  }

  private rethrowHttp(error: unknown, fallback: string): never {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException(fallback);
  }
}
