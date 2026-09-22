import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { AppModule } from './app.module.js';
import { configureApplication } from './config/configure-application.js';
import type { Environment } from './config/environment.js';

type RequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

let requestHandler: Promise<RequestHandler> | undefined;

async function createRequestHandler(): Promise<RequestHandler> {
  const logger = new ConsoleLogger({ json: true, colors: false, flattenParams: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger,
  });
  const config = app.get(ConfigService<Environment, true>);

  app.use(helmet());
  configureApplication(app, config);
  await app.init();

  return app.getHttpAdapter().getInstance();
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  requestHandler ??= createRequestHandler();
  (await requestHandler)(request, response);
}
