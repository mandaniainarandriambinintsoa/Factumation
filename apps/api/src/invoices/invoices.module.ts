import { Module } from '@nestjs/common';

import { InvoicesController } from './invoices.controller.js';
import { InvoicesRepository } from './invoices.repository.js';
import { InvoicesService } from './invoices.service.js';
import { DocumentEmailGateway } from '../documents/document-email.gateway.js';
import { DocumentStorageGateway } from '../documents/document-storage.gateway.js';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesRepository, InvoicesService, DocumentEmailGateway, DocumentStorageGateway],
})
export class InvoicesModule {}
