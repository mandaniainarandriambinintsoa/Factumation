import {
  Body,
  Controller,
  Get,
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
  CreateQuoteDto,
  QuoteListQueryDto,
  QuoteListResponseDto,
  QuoteResponseDto,
  UpdateQuoteDto,
} from './dto/quote.dto.js';
import { QuotesService } from './quotes.service.js';

@ApiTags('quotes')
@ApiBearerAuth('supabase-jwt')
@ApiSecurity('external-api-key')
@Controller({ path: 'quotes', version: '1' })
export class QuotesController {
  constructor(@Inject(QuotesService) private readonly quotes: QuotesService) {}

  @Get()
  @ApiOkResponse({ type: QuoteListResponseDto })
  list(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Query() query: QuoteListQueryDto,
  ): Promise<QuoteListResponseDto> {
    return this.quotes.list(principal, token, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: QuoteResponseDto })
  findOne(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotes.findOne(principal, token, id);
  }

  @Get(':id/pdf')
  async pdf(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const bytes = await this.quotes.renderPdf(principal, token, id);
    return new StreamableFile(Buffer.from(bytes), {
      type: 'application/pdf',
      disposition: `attachment; filename="quote-${id}.pdf"`,
    });
  }

  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiCreatedResponse({ type: QuoteResponseDto })
  create(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() input: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotes.create(principal, token, idempotencyKey, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: QuoteResponseDto })
  update(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotes.update(principal, token, id, input);
  }

  @Post(':id/issue')
  @HttpCode(200)
  @ApiOkResponse({ type: QuoteResponseDto })
  issue(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotes.issue(principal, token, id);
  }

  @Post(':id/send')
  @HttpCode(200)
  @ApiOkResponse({ type: QuoteResponseDto })
  send(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotes.send(principal, token, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOkResponse({ type: QuoteResponseDto })
  accept(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotes.transition(principal, token, id, 'accepted');
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOkResponse({ type: QuoteResponseDto })
  reject(
    @CurrentPrincipal() principal: AuthPrincipal,
    @CurrentAccessToken() token: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotes.transition(principal, token, id, 'rejected');
  }
}
