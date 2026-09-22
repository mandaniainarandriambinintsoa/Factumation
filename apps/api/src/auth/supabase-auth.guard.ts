import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestWithContext } from '../common/http/request.types.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { ApiKeyAuthenticator } from './api-key-authenticator.service.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SupabaseTokenVerifier) private readonly tokenVerifier: SupabaseTokenVerifier,
    @Inject(ApiKeyAuthenticator) private readonly apiKeys: ApiKeyAuthenticator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const rawApiKey = request.header('x-api-key');
    if (rawApiKey) {
      if (request.header('authorization'))
        throw new UnauthorizedException('Use either a bearer token or an API key, not both.');
      if (request.method !== 'GET' && request.method !== 'HEAD')
        throw new ForbiddenException('External API keys are read-only in this release.');
      const authentication = await this.apiKeys.verify(rawApiKey);
      const requiredScope = this.readScope(request.path);
      if (!requiredScope || !authentication.principal.scopes?.includes(requiredScope))
        throw new ForbiddenException('The API key does not grant access to this resource.');
      request.principal = authentication.principal;
      request.accessToken = authentication.serviceRoleToken;
      return true;
    }
    const token = this.extractBearerToken(request.header('authorization'));
    if (!token) throw new UnauthorizedException('A bearer access token is required.');

    request.principal = { ...(await this.tokenVerifier.verify(token)), authType: 'user' };
    request.accessToken = token;
    return true;
  }

  private readScope(path: string): string | undefined {
    for (const resource of ['invoices', 'quotes', 'clients', 'companies'] as const) {
      if (path.includes(`/${resource}`)) return `${resource}:read`;
    }
    return undefined;
  }

  private extractBearerToken(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const match = /^Bearer\s+([^\s]+)$/i.exec(value.trim());
    return match?.[1];
  }
}
