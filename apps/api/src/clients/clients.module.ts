import { Module } from '@nestjs/common';

import { ClientsController } from './clients.controller.js';
import { ClientsRepository } from './clients.repository.js';
import { ClientsService } from './clients.service.js';

@Module({
  controllers: [ClientsController],
  providers: [ClientsRepository, ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
