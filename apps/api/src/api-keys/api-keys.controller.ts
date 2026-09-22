import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { ApiKeysService } from './api-keys.service.js';
import {
  ApiCredentialResponseDto,
  CreateApiCredentialDto,
  CreatedApiCredentialResponseDto,
  RotateApiCredentialDto,
} from './dto/api-key.dto.js';

@ApiTags('api-keys')
@ApiBearerAuth('supabase-jwt')
@Controller({ path: 'api-keys', version: '1' })
export class ApiKeysController {
  constructor(@Inject(ApiKeysService) private readonly apiKeys: ApiKeysService) {}

  @Get()
  @ApiOkResponse({ type: ApiCredentialResponseDto, isArray: true })
  list(@CurrentAccessToken() token: string): Promise<ApiCredentialResponseDto[]> {
    return this.apiKeys.list(token);
  }

  @Post()
  @ApiCreatedResponse({ type: CreatedApiCredentialResponseDto })
  create(
    @CurrentAccessToken() token: string,
    @Body() input: CreateApiCredentialDto,
  ): Promise<CreatedApiCredentialResponseDto> {
    return this.apiKeys.create(token, input);
  }

  @Post(':clientId/rotate')
  @ApiCreatedResponse({ type: CreatedApiCredentialResponseDto })
  rotate(
    @CurrentAccessToken() token: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() input: RotateApiCredentialDto,
  ): Promise<CreatedApiCredentialResponseDto> {
    return this.apiKeys.rotate(token, clientId, input);
  }

  @Delete(':keyId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async revoke(
    @CurrentAccessToken() token: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
  ): Promise<void> {
    await this.apiKeys.revoke(token, keyId);
  }
}
