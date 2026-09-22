import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './auth.controller.js';
import { ApiKeyAuthenticator } from './api-key-authenticator.service.js';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    SupabaseTokenVerifier,
    ApiKeyAuthenticator,
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
  exports: [SupabaseTokenVerifier],
})
export class AuthModule {}
