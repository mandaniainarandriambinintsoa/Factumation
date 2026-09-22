import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type { ApiCredentialRow } from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';

@Injectable()
export class ApiKeysRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async list(accessToken: string): Promise<ApiCredentialRow[]> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('list_api_credentials');
    if (error) throw new DataAccessError('apiKeys.list', error.code);
    return data ?? [];
  }

  async create(
    accessToken: string,
    values: {
      p_name: string;
      p_allowed_company_ids: string[];
      p_prefix: string;
      p_secret_hash: string;
      p_scopes: string[];
      p_expires_at: string | null;
    },
  ): Promise<{ client_id: string; key_id: string }> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('create_api_credential', values);
    const result = data?.[0];
    if (error || !result) throw new DataAccessError('apiKeys.create', error?.code);
    return result;
  }

  async rotate(
    accessToken: string,
    values: {
      p_client_id: string;
      p_prefix: string;
      p_secret_hash: string;
      p_scopes: string[];
      p_expires_at: string | null;
    },
  ): Promise<string> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('rotate_api_credential', values);
    if (error || !data) throw new DataAccessError('apiKeys.rotate', error?.code);
    return data;
  }

  async revoke(accessToken: string, keyId: string): Promise<void> {
    const { error } = await this.clients
      .createForUser(accessToken)
      .rpc('revoke_api_credential', { p_key_id: keyId });
    if (error) throw new DataAccessError('apiKeys.revoke', error.code);
  }
}
