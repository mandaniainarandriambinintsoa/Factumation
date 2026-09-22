import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { randomUUID } from 'node:crypto';

import type { RequestWithContext } from './request.types.js';

const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const incoming = request.header('x-request-id');
    request.requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    response.setHeader('x-request-id', request.requestId);
    next();
  }
}
