import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthPrincipal } from '../auth/auth-principal.js';
import { CurrentAccessToken } from '../auth/current-access-token.decorator.js';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import {
  CreateInvoiceDto,
  InvoiceListQueryDto,
  InvoiceListResponseDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto.js';
import { InvoicesService } from './invoices.service.js';

@ApiTags('invoices')
@ApiBearerAuth('supabase-jwt')
@ApiSecurity('external-api-key')
@Controller({ path: 'invoices', version: '1' })
export class InvoicesController {
  constructor(@Inject(InvoicesService) private readonly invoices: InvoicesService) {}

  @Get()
  @ApiOkResponse({ type: InvoiceListResponseDto })
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Query() query: InvoiceListQueryDto,
  ): Promise<InvoiceListResponseDto> {
    return this.invoices.list(principal, token, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: InvoiceResponseDto })
  findOne(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoices.findOne(principal, token, id);
  }

  @Get(':id/pdf')
  async pdf(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const bytes = await this.invoices.renderPdf(principal, token, id);
    return new StreamableFile(Buffer.from(bytes), {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id}.pdf"`,
    });
  }

  @Post()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'A unique 8-128 character key for this logical draft creation request.',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  create(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() input: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoices.create(principal, token, idempotencyKey, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: InvoiceResponseDto })
  update(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoices.update(principal, token, id, input);
  }

  @Post(':id/issue')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: InvoiceResponseDto })
  issue(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoices.issue(principal, token, id);
  }

  @Post(':id/send')
  @HttpCode(200)
  @ApiOkResponse({ type: InvoiceResponseDto })
  send(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.send(principal, token, id);
  }

  @Post(':id/mark-paid')
  @HttpCode(200)
  @ApiOkResponse({ type: InvoiceResponseDto })
  markPaid(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.markPaid(principal, token, id);
  }
}
