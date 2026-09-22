import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardSummaryDto } from './dto/dashboard.dto.js';

@ApiTags('dashboard')
@ApiBearerAuth('supabase-jwt')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOkResponse({ type: DashboardSummaryDto })
  getSummary(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
  ): Promise<DashboardSummaryDto> {
    return this.dashboard.getSummary(principal, token);
  }
}
