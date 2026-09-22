import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestWithContext } from '../common/http/request.types.js';

export const CurrentAccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.accessToken) throw new Error('Authenticated request is missing its access token.');
    return request.accessToken;
  },
);
