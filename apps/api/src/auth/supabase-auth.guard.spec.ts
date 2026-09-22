import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import type { RequestWithContext } from '../common/http/request.types.js';
import type { ApiKeyAuthenticator } from './api-key-authenticator.service.js';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';
import type { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

const apiKey = `fak_live_AbCdEf123456.${'x'.repeat(43)}`;

function setup(method: string, path: string, headers: Record<string, string> = {}) {
  const request = {
    method,
    path,
    requestId: 'request-id',
    header: vi.fn((name: string) => headers[name.toLowerCase()]),
  } as unknown as RequestWithContext;
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
  const tokenVerifier = { verify: vi.fn() };
  const apiKeys = {
    verify: vi.fn().mockResolvedValue({
      principal: {
        id: '00000000-0000-4000-8000-000000000001',
        role: 'integration',
        authType: 'api-key',
        scopes: ['invoices:read'],
      },
      serviceRoleToken: 'service-role-token',
    }),
  };
  const guard = new SupabaseAuthGuard(
    reflector as unknown as Reflector,
    tokenVerifier as unknown as SupabaseTokenVerifier,
    apiKeys as unknown as ApiKeyAuthenticator,
  );
  return { apiKeys, guard, context, request };
}

describe('SupabaseAuthGuard API keys', () => {
  it('authorizes a read when the key grants the resource scope', async () => {
    const { guard, context, request } = setup('GET', '/api/v1/invoices', {
      'x-api-key': apiKey,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.principal).toMatchObject({ authType: 'api-key', scopes: ['invoices:read'] });
    expect(request.accessToken).toBe('service-role-token');
  });

  it('rejects API-key writes before authenticating the credential', async () => {
    const { apiKeys, guard, context } = setup('POST', '/api/v1/invoices', {
      'x-api-key': apiKey,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(apiKeys.verify).not.toHaveBeenCalled();
  });

  it('rejects requests that mix a bearer token and an API key', async () => {
    const { apiKeys, guard, context } = setup('GET', '/api/v1/invoices', {
      authorization: 'Bearer user-token',
      'x-api-key': apiKey,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(apiKeys.verify).not.toHaveBeenCalled();
  });
});
