import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { SupabaseHealthService } from './supabase-health.service.js';

@Module({
  controllers: [HealthController],
  providers: [SupabaseHealthService],
})
export class HealthModule {}
