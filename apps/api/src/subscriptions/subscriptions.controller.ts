import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import { SubscriptionResponseDto, UsageResponseDto } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('subscription')
@ApiBearerAuth('supabase-jwt')
@Controller({ version: '1' })
export class SubscriptionsController {
  constructor(@Inject(SubscriptionsService) private readonly subscriptions: SubscriptionsService) {}
  @Get('subscription')
  @ApiOkResponse({ type: SubscriptionResponseDto })
  get(@CurrentPrincipal() principal: AuthPrincipal, @CurrentAccessToken() token: string) {
    return this.subscriptions.get(principal, token);
  }
  @Get('usage')
  @ApiOkResponse({ type: UsageResponseDto })
  usage(@CurrentPrincipal() principal: AuthPrincipal, @CurrentAccessToken() token: string) {
    return this.subscriptions.usage(principal, token);
  }
}
