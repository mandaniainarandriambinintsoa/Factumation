import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
import { z } from 'zod';

import type { Environment } from '../config/environment.js';
import type { AuthPrincipal } from './auth-principal.js';

const claimsSchema = z.object({
  sub: z.string().uuid(),
  role: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  session_id: z.string().min(1).optional(),
});

@Injectable()
export class SupabaseTokenVerifier {
  private readonly audience: string;
  private readonly anonKey: string;
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly timeoutMs: number;
  private readonly userEndpoint: URL;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    const supabaseUrl = config.get('SUPABASE_URL', { infer: true }).replace(/\/$/, '');
    this.anonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.audience = config.get('SUPABASE_JWT_AUDIENCE', { infer: true });
    this.timeoutMs = config.get('DEPENDENCY_TIMEOUT_MS', { infer: true });
    this.issuer = `${supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`), {
      timeoutDuration: this.timeoutMs,
      cooldownDuration: 10 * 60 * 1000,
      cacheMaxAge: 10 * 60 * 1000,
    });
    this.userEndpoint = new URL(`${this.issuer}/user`);
  }

  async verify(token: string): Promise<AuthPrincipal> {
    try {
      const { alg } = decodeProtectedHeader(token);
      const payload =
        alg === 'HS256' ? await this.verifyLegacyToken(token) : await this.verifyJwksToken(token);
      return this.toPrincipal(payload);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private async verifyJwksToken(token: string): Promise<JWTPayload> {
    const result = await jwtVerify(token, this.jwks, {
      algorithms: ['ES256', 'RS256'],
      audience: this.audience,
      issuer: this.issuer,
    });
    return result.payload;
  }

  private async verifyLegacyToken(token: string): Promise<JWTPayload> {
    const response = await fetch(this.userEndpoint, {
      headers: {
        apikey: this.anonKey,
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) throw new Error('Supabase Auth rejected the access token.');

    const user = (await response.json()) as {
      id?: unknown;
      email?: unknown;
      phone?: unknown;
      role?: unknown;
    };
    return {
      ...(typeof user.id === 'string' ? { sub: user.id } : {}),
      role: typeof user.role === 'string' ? user.role : this.audience,
      ...(typeof user.email === 'string' ? { email: user.email } : {}),
      ...(typeof user.phone === 'string' ? { phone: user.phone } : {}),
    };
  }

  private toPrincipal(payload: JWTPayload): AuthPrincipal {
    const claims = claimsSchema.parse(payload);
    return {
      id: claims.sub,
      role: claims.role,
      ...(claims.email ? { email: claims.email } : {}),
      ...(claims.phone ? { phone: claims.phone } : {}),
      ...(claims.session_id ? { sessionId: claims.session_id } : {}),
    };
  }
}
