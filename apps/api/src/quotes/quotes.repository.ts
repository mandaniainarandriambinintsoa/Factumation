import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type {
  CreateQuoteDraftArgs,
  QuoteReadRow,
  QuoteUpdate,
} from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';

const QUOTE_COLUMNS =
  'id,user_id,company_id,client_id,draft_reference,quote_number,quote_date,validity_date,company_name,company_address,company_email,company_phone,logo_url,client_name,client_address,client_email,client_phone,items,subtotal,tax_mode,tax_rate,tax_amount,withholding_amount,total,amount_due,currency,payment_method,status,calculation_version,issued_at,notes,created_at,updated_at';

export type QuotePage = { rows: QuoteReadRow[]; total: number };

export class QuoteIdempotencyConflictError extends Error {
  constructor() {
    super('The idempotency key was already used for a different request.');
    this.name = 'QuoteIdempotencyConflictError';
  }
}

export class QuoteStateConflictError extends Error {
  constructor(message = 'The quote cannot perform this transition from its current state.') {
    super(message);
    this.name = 'QuoteStateConflictError';
  }
}

export class QuoteQuotaExceededError extends Error {
  constructor() {
    super('Monthly quote limit reached.');
    this.name = 'QuoteQuotaExceededError';
  }
}

@Injectable()
export class QuotesRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async list(input: {
    accessToken: string;
    ownerId: string;
    page: number;
    limit: number;
    status?: string;
    allowedCompanyIds?: readonly string[];
  }): Promise<QuotePage> {
    const from = (input.page - 1) * input.limit;
    let query = this.clients
      .createForUser(input.accessToken)
      .from('quotes')
      .select(QUOTE_COLUMNS, { count: 'exact' })
      .eq('user_id', input.ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + input.limit - 1);
    if (input.status) query = query.eq('status', input.status);
    if (input.allowedCompanyIds?.length)
      query = query.in('company_id', [...input.allowedCompanyIds]);
    const { data, error, count } = await query;
    if (error) throw new DataAccessError('quotes.list', error.code);
    return { rows: data, total: count ?? 0 };
  }

  async findById(accessToken: string, ownerId: string, id: string): Promise<QuoteReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('quotes')
      .select(QUOTE_COLUMNS)
      .eq('id', id)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('quotes.findById', error.code);
    return data;
  }

  async createDraft(
    accessToken: string,
    ownerId: string,
    values: CreateQuoteDraftArgs,
  ): Promise<QuoteReadRow> {
    const { data: id, error } = await this.clients
      .createForUser(accessToken)
      .rpc('create_quote_draft', values);
    if (error) {
      if (
        error.code === '22023' &&
        error.message.includes('Idempotency key reused with a different request')
      ) {
        throw new QuoteIdempotencyConflictError();
      }
      if (error.code === 'P0004') throw new QuoteQuotaExceededError();
      throw new DataAccessError('quotes.createDraft', error.code);
    }
    const row = await this.findById(accessToken, ownerId, id);
    if (!row) throw new DataAccessError('quotes.createDraft.read');
    return row;
  }

  async updateDraft(
    accessToken: string,
    ownerId: string,
    id: string,
    values: QuoteUpdate,
  ): Promise<QuoteReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('quotes')
      .update(values)
      .eq('id', id)
      .eq('user_id', ownerId)
      .eq('status', 'draft')
      .eq('calculation_version', 'v2')
      .select(QUOTE_COLUMNS)
      .maybeSingle();
    if (error) throw new DataAccessError('quotes.updateDraft', error.code);
    return data;
  }

  async issue(accessToken: string, ownerId: string, id: string): Promise<QuoteReadRow | null> {
    const { data: issuedId, error } = await this.clients
      .createForUser(accessToken)
      .rpc('issue_quote', { p_quote_id: id });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new QuoteStateConflictError();
      throw new DataAccessError('quotes.issue', error.code);
    }
    return this.findById(accessToken, ownerId, issuedId);
  }

  async transition(
    accessToken: string,
    ownerId: string,
    id: string,
    targetStatus: 'accepted' | 'rejected',
  ): Promise<QuoteReadRow | null> {
    const { data: updatedId, error } = await this.clients
      .createForUser(accessToken)
      .rpc('transition_quote', { p_quote_id: id, p_target_status: targetStatus });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new QuoteStateConflictError();
      throw new DataAccessError('quotes.transition', error.code);
    }
    return this.findById(accessToken, ownerId, updatedId);
  }

  async hasEmailEntitlement(accessToken: string, ownerId: string): Promise<boolean> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('subscriptions')
      .select('plan,status,manual_expires_at')
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('quotes.hasEmailEntitlement', error.code);
    if (
      !data ||
      !['pro', 'business'].includes(data.plan) ||
      !['active', 'trialing'].includes(data.status)
    )
      return false;
    return !data.manual_expires_at || data.manual_expires_at > new Date().toISOString();
  }

  async markSent(accessToken: string, ownerId: string, id: string): Promise<QuoteReadRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('mark_quote_sent', { p_quote_id: id });
    if (error) {
      if (error.code === 'P0002') return null;
      if (error.code === 'P0001') throw new QuoteStateConflictError(error.message);
      throw new DataAccessError('quotes.markSent', error.code);
    }
    return this.findById(accessToken, ownerId, data);
  }
}
