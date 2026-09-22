import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import type { SubscriptionResponseDto, UsageResponseDto } from './dto/subscription.dto.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';

const plans = {
  free: {
    invoicesPerMonth: 2,
    quotesPerMonth: 2,
    companies: 1,
    customLogo: false,
    emailSending: false,
    recurringInvoices: false,
  },
  pro: {
    invoicesPerMonth: -1,
    quotesPerMonth: -1,
    companies: 3,
    customLogo: true,
    emailSending: true,
    recurringInvoices: false,
  },
  business: {
    invoicesPerMonth: -1,
    quotesPerMonth: -1,
    companies: 10,
    customLogo: true,
    emailSending: true,
    recurringInvoices: true,
  },
} as const;

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(SubscriptionsRepository) private readonly repository: SubscriptionsRepository,
  ) {}

  async get(principal: AuthPrincipal, accessToken: string): Promise<SubscriptionResponseDto> {
    try {
      const row = await this.repository.findForOwner(accessToken, principal.id);
      const plan = row?.plan === 'pro' || row?.plan === 'business' ? row.plan : 'free';
      const active = row?.status === 'active' || row?.status === 'trialing';
      const effectivePlan = active ? plan : 'free';
      return {
        plan: effectivePlan,
        status: row?.status ?? 'active',
        source: row?.source ?? 'default',
        cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
        currentPeriodEnd: row?.current_period_end ?? row?.manual_expires_at ?? null,
        features: plans[effectivePlan],
      };
    } catch {
      throw new InternalServerErrorException('Unable to load the subscription.');
    }
  }

  async usage(principal: AuthPrincipal, accessToken: string): Promise<UsageResponseDto> {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    try {
      return {
        ...(await this.repository.usage(accessToken, principal.id, start.toISOString())),
        periodStart: start.toISOString(),
      };
    } catch {
      throw new InternalServerErrorException('Unable to load usage.');
    }
  }
}
