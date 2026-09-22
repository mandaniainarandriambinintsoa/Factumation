import {
  RequestMethod,
  ValidationPipe,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { type Environment, parseAllowedOrigins } from './environment.js';

export function configureApplication(
  app: INestApplication,
  config: ConfigService<Environment, true>,
): void {
  const bodyLimit = config.get('REQUEST_BODY_LIMIT', { infer: true });
  const allowedOrigins = parseAllowedOrigins(config.get('CORS_ORIGINS', { infer: true }));

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: false, limit: bodyLimit }));
  app.enableCors({
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (origin === undefined || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });
  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    }),
  );

  if (config.get('ENABLE_SWAGGER', { infer: true })) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Factumation API')
      .setDescription('API versionnée du moteur de facturation Factumation.')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase JWT' },
        'supabase-jwt',
      )
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'external-api-key')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      jsonDocumentUrl: 'api/docs/openapi.json',
      swaggerOptions: { persistAuthorization: false },
    });
  }
}
