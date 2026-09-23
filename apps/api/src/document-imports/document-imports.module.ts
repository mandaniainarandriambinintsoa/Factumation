import { Module } from '@nestjs/common';

import { DocumentImportsController } from './document-imports.controller.js';
import { DocumentImportsService } from './document-imports.service.js';
import { OpenRouterGateway } from './openrouter.gateway.js';

@Module({
  controllers: [DocumentImportsController],
  providers: [DocumentImportsService, OpenRouterGateway],
})
export class DocumentImportsModule {}
