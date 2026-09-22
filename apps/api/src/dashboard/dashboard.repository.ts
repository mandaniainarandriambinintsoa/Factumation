import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';

import { DataAccessError } from '../common/data/data-access.error.js';
import { SupabaseClientFactory } from '../common/supabase/supabase-client.factory.js';
import type { DashboardSummaryDto } from './dto/dashboard.dto.js';

const currencyAmountSchema = z.object({
  currency: z.string().length(3),
  amount: z.string().regex(/^\d+(?:\.\d+)?$/),
  count: z.number().int().nonnegative(),
});

const invoiceCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  issued: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  paid: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
});

const quoteCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  issued: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
});

const dashboardSummarySchema = z.object({
  invoices: invoiceCountsSchema,
  quotes: quoteCountsSchema,
  clients: z.number().int().nonnegative(),
  revenueByCurrency: z.array(currencyAmountSchema),
  pendingByCurrency: z.array(currencyAmountSchema),
});

@Injectable()
export class DashboardRepository {
  constructor(@Inject(SupabaseClientFactory) private readonly clients: SupabaseClientFactory) {}

  async getSummary(accessToken: string): Promise<DashboardSummaryDto> {
    const { data, error } = await this.clients
      .createForUser(accessToken)
      .rpc('get_dashboard_summary');
    if (error) throw new DataAccessError('dashboard.summary', error.code);
    const parsed = dashboardSummarySchema.safeParse(data);
    if (!parsed.success) throw new DataAccessError('dashboard.summary.invalid_response');
    return parsed.data;
  }
}
