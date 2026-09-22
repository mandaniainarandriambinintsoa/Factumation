import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type { ClientInsert, ClientRow, ClientUpdate } from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';
import { escapePostgrestLikePattern } from '../common/validation/field-patterns.js';

const CLIENT_COLUMNS =
  'id,user_id,name,email,address,phone,company_name,fiscal_region,siret,vat_number,nif,stat,notes,created_at,updated_at';

export type ClientPage = { rows: ClientRow[]; total: number };

@Injectable()
export class ClientsRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async list(input: {
    accessToken: string;
    ownerId: string;
    page: number;
    limit: number;
    search?: string;
  }): Promise<ClientPage> {
    const from = (input.page - 1) * input.limit;
    const to = from + input.limit - 1;
    let query = this.clients
      .createForUser(input.accessToken)
      .from('clients')
      .select(CLIENT_COLUMNS, { count: 'exact' })
      .eq('user_id', input.ownerId)
      .order('name', { ascending: true })
      .range(from, to);

    if (input.search) {
      const pattern = `*${escapePostgrestLikePattern(input.search)}*`;
      query = query.or(
        `name.ilike.${pattern},email.ilike.${pattern},company_name.ilike.${pattern}`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw new DataAccessError('clients.list', error.code);
    return { rows: data, total: count ?? 0 };
  }

  async findById(accessToken: string, ownerId: string, id: string): Promise<ClientRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('clients')
      .select(CLIENT_COLUMNS)
      .eq('id', id)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('clients.findById', error.code);
    return data;
  }

  async create(accessToken: string, values: ClientInsert): Promise<ClientRow> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('clients')
      .insert(values)
      .select(CLIENT_COLUMNS)
      .single();
    if (error) throw new DataAccessError('clients.create', error.code);
    return data;
  }

  async update(
    accessToken: string,
    ownerId: string,
    id: string,
    values: ClientUpdate,
  ): Promise<ClientRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('clients')
      .update(values)
      .eq('id', id)
      .eq('user_id', ownerId)
      .select(CLIENT_COLUMNS)
      .maybeSingle();
    if (error) throw new DataAccessError('clients.update', error.code);
    return data;
  }

  async delete(accessToken: string, ownerId: string, id: string): Promise<boolean> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', ownerId)
      .select('id')
      .maybeSingle();
    if (error) throw new DataAccessError('clients.delete', error.code);
    return data !== null;
  }
}
