import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import type { RequestWithContext } from '../http/request.types.js';

type HttpExceptionBody = {
  error?: string;
  message?: string | string[];
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;
    const parsed = this.parseExceptionBody(exceptionBody);

    if (status >= 500) {
      this.logger.error('HTTP request failed', {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        errorName: exception instanceof Error ? exception.name : 'UnknownError',
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: parsed.title ?? this.titleForStatus(status),
        status,
        detail:
          status >= 500
            ? 'An unexpected server error occurred.'
            : (parsed.detail ?? 'Request failed.'),
        instance: request.originalUrl,
        requestId: request.requestId,
        ...(parsed.errors ? { errors: parsed.errors } : {}),
      });
  }

  private parseExceptionBody(body: string | object | undefined): {
    title?: string;
    detail?: string;
    errors?: string[];
  } {
    if (typeof body === 'string') return { detail: body };
    if (!body || typeof body !== 'object') return {};

    const candidate = body as HttpExceptionBody;
    if (Array.isArray(candidate.message)) {
      return {
        ...(candidate.error ? { title: candidate.error } : {}),
        detail: 'Request validation failed.',
        errors: candidate.message,
      };
    }
    return {
      ...(candidate.error ? { title: candidate.error } : {}),
      ...(candidate.message ? { detail: candidate.message } : {}),
    };
  }

  private titleForStatus(status: number): string {
    return HttpStatus[status] ?? 'Error';
  }
}
