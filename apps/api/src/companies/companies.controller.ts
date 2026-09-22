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

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import { CompaniesService } from './companies.service.js';
import {
  CompanyListQueryDto,
  CompanyListResponseDto,
  CompanyResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './dto/company.dto.js';

@ApiTags('companies')
@ApiBearerAuth('supabase-jwt')
@ApiSecurity('external-api-key')
@Controller({ path: 'companies', version: '1' })
export class CompaniesController {
  constructor(@Inject(CompaniesService) private readonly companies: CompaniesService) {}

  @Get()
  @ApiOkResponse({ type: CompanyListResponseDto })
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Query() query: CompanyListQueryDto,
  ): Promise<CompanyListResponseDto> {
    return this.companies.list(principal, token, query);
  }

  @Get('default')
  @ApiOkResponse({ type: CompanyResponseDto })
  findDefault(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
  ): Promise<CompanyResponseDto | null> {
    return this.companies.findDefault(principal, token);
  }

  @Get(':id')
  @ApiOkResponse({ type: CompanyResponseDto })
  findOne(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompanyResponseDto> {
    return this.companies.findOne(principal, token, id);
  }

  @Post()
  @ApiCreatedResponse({ type: CompanyResponseDto })
  create(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Body() input: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companies.create(principal, token, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: CompanyResponseDto })
  update(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companies.update(principal, token, id, input);
  }

  @Patch(':id/default')
  @ApiOkResponse({ type: CompanyResponseDto })
  setDefault(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompanyResponseDto> {
    return this.companies.setDefault(principal, token, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  delete(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.companies.delete(principal, token, id);
  }
}
