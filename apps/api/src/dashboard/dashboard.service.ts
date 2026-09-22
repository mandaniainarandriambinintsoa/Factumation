import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { DashboardRepository } from './dashboard.repository.js';
import type { DashboardSummaryDto } from './dto/dashboard.dto.js';

@Injectable()
export class DashboardService {
  constructor(@Inject(DashboardRepository) private readonly repository: DashboardRepository) {}

  async getSummary(principal: AuthPrincipal, accessToken: string): Promise<DashboardSummaryDto> {
    if (principal.authType === 'api-key') {
      throw new ForbiddenException('Dashboard analytics require a user session.');
    }
    try {
      return await this.repository.getSummary(accessToken);
    } catch {
      throw new InternalServerErrorException('Unable to load dashboard analytics.');
    }
  }
}
