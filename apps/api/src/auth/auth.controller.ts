import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import type { AuthPrincipal } from './auth-principal.js';
import { AuthPrincipalResponse } from './auth-response.dto.js';
import { CurrentPrincipal } from './current-principal.decorator.js';

@ApiTags('auth')
@ApiBearerAuth('supabase-jwt')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  @Get('me')
  @ApiOkResponse({ type: AuthPrincipalResponse })
  @ApiUnauthorizedResponse({ description: 'JWT absent, invalide ou expiré.' })
  getCurrentUser(@CurrentPrincipal() principal: AuthPrincipal): AuthPrincipalResponse {
    return {
      id: principal.id,
      role: principal.role,
      ...(principal.email ? { email: principal.email } : {}),
      ...(principal.phone ? { phone: principal.phone } : {}),
    };
  }
}
