import { Module } from '@nestjs/common';

import { QuotesController } from './quotes.controller.js';
import { QuotesRepository } from './quotes.repository.js';
import { QuotesService } from './quotes.service.js';
import { DocumentEmailGateway } from '../documents/document-email.gateway.js';
import { DocumentStorageGateway } from '../documents/document-storage.gateway.js';

@Module({
  controllers: [QuotesController],
  providers: [QuotesRepository, QuotesService, DocumentEmailGateway, DocumentStorageGateway],
})
export class QuotesModule {}
