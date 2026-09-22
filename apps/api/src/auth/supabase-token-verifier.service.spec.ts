import type { ConfigService } from '@nestjs/config';
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Environment } from '../config/environment.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

const issuer = 'https://project.supabase.co/auth/v1';
const subject = '8c5b87ec-b141-4bad-92e1-a848a6802dcf';
const environment: Environment = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 3001,
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key-with-enough-characters',
  SUPABASE_JWT_AUDIENCE: 'authenticated',
  CORS_ORIGINS: 'http://localhost:3000',
  ENABLE_SWAGGER: false,
  REQUEST_BODY_LIMIT: '1mb',
  DEPENDENCY_TIMEOUT_MS: 1000,
  THROTTLE_TTL_MS: 60_000,
  THROTTLE_LIMIT: 120,
};

function createConfig(): ConfigService<Environment, true> {
  return {
    get: <Key extends keyof Environment>(key: Key): Environment[Key] => environment[key],
  } as ConfigService<Environment, true>;
}

describe('SupabaseTokenVerifier', () => {
  let privateKey: CryptoKey;
  let publicJwk: JWK;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicJwk = { ...(await exportJWK(keyPair.publicKey)), alg: 'RS256', kid: 'test-key' };
  });

  async function createJwt(overrides?: {
    audience?: string;
    expiresAt?: string;
    tokenIssuer?: string;
  }): Promise<string> {
    return new SignJWT({ role: 'authenticated', email: 'user@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject(subject)
      .setIssuer(overrides?.tokenIssuer ?? issuer)
      .setAudience(overrides?.audience ?? 'authenticated')
      .setExpirationTime(overrides?.expiresAt ?? '5m')
      .sign(privateKey);
  }

  function mockJwks(): void {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ keys: [publicJwk] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
  }

  it('accepts a valid asymmetric Supabase JWT', async () => {
    mockJwks();
    const verifier = new SupabaseTokenVerifier(createConfig());

    await expect(verifier.verify(await createJwt())).resolves.toEqual({
      id: subject,
      role: 'authenticated',
      email: 'user@example.com',
    });
  });

  it.each([
    ['expired token', { expiresAt: '0s' }],
    ['wrong audience', { audience: 'service_role' }],
    ['wrong issuer', { tokenIssuer: 'https://attacker.example/auth/v1' }],
  ])('rejects a %s', async (_label, overrides) => {
    mockJwks();
    const verifier = new SupabaseTokenVerifier(createConfig());

    await expect(verifier.verify(await createJwt(overrides))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('delegates legacy HS256 verification to Supabase Auth', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: subject, role: 'authenticated', email: 'legacy@example.com' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const verifier = new SupabaseTokenVerifier(createConfig());
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('test-only-secret-with-at-least-32-bytes'));

    await expect(verifier.verify(token)).resolves.toMatchObject({
      id: subject,
      email: 'legacy@example.com',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`${issuer}/user`),
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: `Bearer ${token}` }),
      }),
    );
  });
});
