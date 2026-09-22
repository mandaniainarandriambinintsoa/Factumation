import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestWithContext } from '../common/http/request.types.js';
import type { AuthPrincipal } from './auth-principal.js';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.principal) {
      throw new Error('Authenticated request is missing its principal.');
    }
    return request.principal;
  },
);
