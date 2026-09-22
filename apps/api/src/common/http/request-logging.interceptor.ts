import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { tap, type Observable } from 'rxjs';

import type { RequestWithContext } from './request.types.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();

    const logRequest = (statusCode: number): void => {
      this.logger.log('HTTP request completed', {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        principalId: request.principal?.id,
        authType: request.principal?.authType,
        apiKeyId: request.principal?.apiKeyId,
      });
    };

    return next.handle().pipe(
      tap({
        complete: () => logRequest(response.statusCode),
        error: (error: unknown) =>
          logRequest(error instanceof HttpException ? error.getStatus() : 500),
      }),
    );
  }
}
