import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type {
  CreateInvoiceDraftArgs,
  InvoiceReadRow,
  InvoiceUpdate,
} from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';

const INVOICE_COLUMNS =
  'id,user_id,company_id,client_id,draft_reference,invoice_number,invoice_date,due_date,company_name,company_address,company_email,company_phone,logo_url,client_name,client_address,client_email,client_phone,items,subtotal,tax_mode,tax_rate,tax_amount,withholding_amount,total,amount_due,currency,payment_method,status,calculation_version,issued_at,notes,created_at,updated_at';

export type InvoicePage = { rows: InvoiceReadRow[]; total: number };

export class IdempotencyConflictError extends Error {
  constructor() {
    super('The idempotency key was already used for a different request.');
    this.name = 'IdempotencyConflictError';
  }
}

export class InvoiceStateConflictError extends Error {
  constructor(message = 'Only v2 invoice drafts can be issued.') {
    super(message);
    this.name = 'InvoiceStateConflictError';
  }
}

export class InvoiceQuotaExceededError extends Error {
  constructor() {
    super('Monthly invoice limit reached.');
    this.name = 'InvoiceQuotaExceededError';
  }
}

@Injectable()
export class InvoicesRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async list(input: {
    accessToken: string;
    ownerId: string;
    page: number;
    limit: number;
    status?: string;
    allowedCompanyIds?: readonly string[];
  }): Promise<InvoicePage> {
    const from = (input.page - 1) * input.limit;
    let query = this.clients
      .createForUser(input.accessToken)
      .from('invoices')
      .select(INVOICE_COLUMNS, { count: 'exact' })
      .eq('user_id', input.ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + input.limit - 1);
    if (input.status) query = query.eq('status', input.status);
    if (input.allowedCompanyIds?.length)
      query = query.in('company_id', [...input.allowedCompanyIds]);

    const { data, error, count } = await query;
    if (error) throw new DataAccessError('invoices.list', error.code);
    return { rows: data, total: count ?? 0 };
  }

  async findById(accessToken: string, ownerId: string, id: string): Promise<InvoiceReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('invoices')
      .select(INVOICE_COLUMNS)
      .eq('id', id)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('invoices.findById', error.code);
    return data;
  }

  async createDraft(
    accessToken: string,
    ownerId: string,
    values: CreateInvoiceDraftArgs,
  ): Promise<InvoiceReadRow> {
    const { data: id, error } = await this.clients
      .createForUser(accessToken)
      .rpc('create_invoice_draft', values);
    if (error) {
      if (
        error.code === '22023' &&
        error.message.includes('Idempotency key reused with a different request')
      ) {
        throw new IdempotencyConflictError();
      }
      if (error.code === 'P0004') throw new InvoiceQuotaExceededError();
      throw new DataAccessError('invoices.createDraft', error.code);
    }
    const row = await this.findById(accessToken, ownerId, id);
    if (!row) throw new DataAccessError('invoices.createDraft.read');
    return row;
  }

  async updateDraft(
    accessToken: string,
    ownerId: string,
    id: string,
    values: InvoiceUpdate,
  ): Promise<InvoiceReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('invoices')
      .update(values)
      .eq('id', id)
      .eq('user_id', ownerId)
      .eq('status', 'draft')
      .eq('calculation_version', 'v2')
      .select(INVOICE_COLUMNS)
      .maybeSingle();
    if (error) throw new DataAccessError('invoices.updateDraft', error.code);
    return data;
  }

  async issue(accessToken: string, ownerId: string, id: string): Promise<InvoiceReadRow | null> {
    const { data: issuedId, error } = await this.clients
      .createForUser(accessToken)
      .rpc('issue_invoice', { p_invoice_id: id });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new InvoiceStateConflictError();
      throw new DataAccessError('invoices.issue', error.code);
    }
    return this.findById(accessToken, ownerId, issuedId);
  }

  async hasEmailEntitlement(accessToken: string, ownerId: string): Promise<boolean> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('subscriptions')
      .select('plan,status,manual_expires_at')
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('invoices.hasEmailEntitlement', error.code);
    if (
      !data ||
      !['pro', 'business'].includes(data.plan) ||
      !['active', 'trialing'].includes(data.status)
    )
      return false;
    return !data.manual_expires_at || data.manual_expires_at > new Date().toISOString();
  }

  async markSent(accessToken: string, ownerId: string, id: string): Promise<InvoiceReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('mark_invoice_sent', { p_invoice_id: id });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new InvoiceStateConflictError(error.message);
      throw new DataAccessError('invoices.markSent', error.code);
    }
    return this.findById(accessToken, ownerId, data);
  }

  async markPaid(accessToken: string, ownerId: string, id: string): Promise<InvoiceReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('mark_invoice_paid', { p_invoice_id: id });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new InvoiceStateConflictError(error.message);
      throw new DataAccessError('invoices.markPaid', error.code);
    }
    return this.findById(accessToken, ownerId, data);
  }
}
