import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import type { AuthPrincipal } from '../auth/auth-principal.js';
import { ClientsService } from './clients.service.js';
import {
  ClientListQueryDto,
  ClientListResponseDto,
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
} from './dto/client.dto.js';

@ApiTags('clients')
@ApiBearerAuth('supabase-jwt')
@ApiSecurity('external-api-key')
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(@Inject(ClientsService) private readonly clients: ClientsService) {}

  @Get()
  @ApiOkResponse({ type: ClientListResponseDto })
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Query() query: ClientListQueryDto,
  ): Promise<ClientListResponseDto> {
    return this.clients.list(principal, token, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ClientResponseDto })
  findOne(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientResponseDto> {
    return this.clients.findOne(principal, token, id);
  }

  @Post()
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Body() input: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clients.create(principal, token, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ClientResponseDto })
  update(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clients.update(principal, token, id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  delete(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.clients.delete(principal, token, id);
  }
}
