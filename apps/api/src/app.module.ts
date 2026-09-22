import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter.js';
import { RequestLoggingInterceptor } from './common/http/request-logging.interceptor.js';
import { RequestIdMiddleware } from './common/http/request-id.middleware.js';
import { SupabaseModule } from './common/supabase/supabase.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { ContactModule } from './contact/contact.module.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { QuotesModule } from './quotes/quotes.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: false,
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
      validate: validateEnvironment,
    }),
    SupabaseModule,
    ApiKeysModule,
    ClientsModule,
    CompaniesModule,
    ContactModule,
    InvoicesModule,
    QuotesModule,
    SubscriptionsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => [
        {
          name: 'default',
          ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
