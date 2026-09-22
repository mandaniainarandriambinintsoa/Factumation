import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type {
  CompanyInsert,
  CompanyRow,
  CompanyUpdate,
} from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';
import { escapePostgrestLikePattern } from '../common/validation/field-patterns.js';

const COMPANY_COLUMNS =
  'id,user_id,name,address,email,phone,logo_url,fiscal_region,siret,vat_number,nif,stat,iban,bic,default_currency,default_payment_method,invoice_prefix,quote_prefix,is_default,notes,created_at,updated_at';

export type CompanyPage = { rows: CompanyRow[]; total: number };

@Injectable()
export class CompaniesRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async list(input: {
    accessToken: string;
    ownerId: string;
    page: number;
    limit: number;
    search?: string;
    allowedCompanyIds?: readonly string[];
  }): Promise<CompanyPage> {
    const from = (input.page - 1) * input.limit;
    let query = this.clients
      .createForUser(input.accessToken)
      .from('companies')
      .select(COMPANY_COLUMNS, { count: 'exact' })
      .eq('user_id', input.ownerId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
      .range(from, from + input.limit - 1);
    if (input.search) {
      const pattern = `*${escapePostgrestLikePattern(input.search)}*`;
      query = query.or(`name.ilike.${pattern},email.ilike.${pattern}`);
    }
    if (input.allowedCompanyIds?.length) query = query.in('id', [...input.allowedCompanyIds]);
    const { data, error, count } = await query;
    if (error) throw new DataAccessError('companies.list', error.code);
    return { rows: data, total: count ?? 0 };
  }

  async findById(accessToken: string, ownerId: string, id: string): Promise<CompanyRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('companies')
      .select(COMPANY_COLUMNS)
      .eq('id', id)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('companies.findById', error.code);
    return data;
  }

  async findDefault(accessToken: string, ownerId: string): Promise<CompanyRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('companies')
      .select(COMPANY_COLUMNS)
      .eq('user_id', ownerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new DataAccessError('companies.findDefault', error.code);
    return data;
  }

  async create(accessToken: string, values: CompanyInsert): Promise<CompanyRow> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('companies')
      .insert(values)
      .select(COMPANY_COLUMNS)
      .single();
    if (error) throw new DataAccessError('companies.create', error.code);
    return data;
  }

  async update(
    accessToken: string,
    ownerId: string,
    id: string,
    values: CompanyUpdate,
  ): Promise<CompanyRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('companies')
      .update(values)
      .eq('id', id)
      .eq('user_id', ownerId)
      .select(COMPANY_COLUMNS)
      .maybeSingle();
    if (error) throw new DataAccessError('companies.update', error.code);
    return data;
  }

  async delete(accessToken: string, ownerId: string, id: string): Promise<boolean> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', ownerId)
      .select('id')
      .maybeSingle();
    if (error) throw new DataAccessError('companies.delete', error.code);
    return data !== null;
  }

  async setDefault(accessToken: string, ownerId: string, id: string): Promise<CompanyRow | null> {
    const client = this.clients.createForUser(accessToken);
    const { data: updatedId, error } = await client.rpc('set_default_company', {
      p_company_id: id,
    });
    if (error) {
      if (error.code === 'P0002') return null;
      throw new DataAccessError('companies.setDefault', error.code);
    }
    return this.findById(accessToken, ownerId, updatedId);
  }
}
