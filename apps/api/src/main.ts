import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { configureApplication } from './config/configure-application.js';
import type { Environment } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const logger = new ConsoleLogger({ json: true, colors: false, flattenParams: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger,
  });
  const config = app.get(ConfigService<Environment, true>);

  app.use(helmet());
  configureApplication(app, config);
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }), config.get('HOST', { infer: true }));
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap failure';
  process.stderr.write(`${JSON.stringify({ level: 'fatal', message })}\n`);
  process.exitCode = 1;
});
