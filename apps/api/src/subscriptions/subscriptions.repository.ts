import { Inject, Injectable } from '@nestjs/common';

import { DataAccessError } from '../common/data/data-access.error.js';
import type { SubscriptionRow } from '../common/supabase/database.types.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';

const SUBSCRIPTION_COLUMNS =
  'id,user_id,plan,status,source,current_period_start,current_period_end,manual_expires_at,cancel_at_period_end,created_at,updated_at';

@Injectable()
export class SubscriptionsRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async findForOwner(accessToken: string, ownerId: string): Promise<SubscriptionRow | null> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .from('subscriptions')
      .select(SUBSCRIPTION_COLUMNS)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) throw new DataAccessError('subscriptions.findForOwner', error.code);
    return data;
  }

  async usage(
    accessToken: string,
    ownerId: string,
    periodStart: string,
  ): Promise<{ invoices: number; quotes: number; companies: number }> {
    const client = this.clients.createForUser(accessToken);
    const [invoices, quotes, companies] = await Promise.all([
      client
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ownerId)
        .gte('created_at', periodStart),
      client
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ownerId)
        .gte('created_at', periodStart),
      client.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', ownerId),
    ]);
    if (invoices.error || quotes.error || companies.error)
      throw new DataAccessError('subscriptions.usage');
    return {
      invoices: invoices.count ?? 0,
      quotes: quotes.count ?? 0,
      companies: companies.count ?? 0,
    };
  }
}
