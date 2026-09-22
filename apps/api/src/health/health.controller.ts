import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../auth/public.decorator.js';
import { LivenessResponse, ReadinessResponse } from './health-response.dto.js';
import { SupabaseHealthService } from './supabase-health.service.js';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    @Inject(SupabaseHealthService) private readonly supabaseHealth: SupabaseHealthService,
  ) {}

  @Get('live')
  @ApiOkResponse({ type: LivenessResponse })
  getLiveness(): LivenessResponse {
    return { status: 'ok', service: 'factumation-api' };
  }

  @Get('ready')
  @ApiOkResponse({ type: ReadinessResponse })
  @ApiServiceUnavailableResponse({ description: 'Supabase Auth ou Data API est indisponible.' })
  async getReadiness(): Promise<ReadinessResponse> {
    return {
      status: 'ok',
      service: 'factumation-api',
      dependencies: await this.supabaseHealth.check(),
    };
  }
}
