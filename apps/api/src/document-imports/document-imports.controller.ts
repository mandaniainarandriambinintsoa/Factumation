import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { DocumentImportContextDto, DocumentImportResponseDto } from './dto/document-import.dto.js';
import type { UploadedMedia } from './document-import.types.js';
import { DocumentImportsService } from './document-imports.service.js';

const uploadBody = {
  schema: {
    type: 'object',
    required: ['kind', 'file'],
    properties: {
      kind: { type: 'string', enum: ['invoice', 'quote'] },
      file: { type: 'string', format: 'binary' },
    },
  },
};

@ApiTags('document-imports')
@ApiBearerAuth('supabase-jwt')
@Controller({ path: 'document-imports', version: '1' })
@Throttle({ default: { limit: 6, ttl: 60_000 } })
export class DocumentImportsController {
  constructor(@Inject(DocumentImportsService) private readonly imports: DocumentImportsService) {}

  @Post('image')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOkResponse({ type: DocumentImportResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: 8 * 1024 * 1024 } }))
  fromImage(
    @UploadedFile() file: UploadedMedia | undefined,
    @Body() input: DocumentImportContextDto,
  ) {
    return this.imports.fromImage(file, input.kind);
  }

  @Post('voice')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOkResponse({ type: DocumentImportResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: 12 * 1024 * 1024 } }))
  fromVoice(
    @UploadedFile() file: UploadedMedia | undefined,
    @Body() input: DocumentImportContextDto,
  ) {
    return this.imports.fromVoice(file, input.kind);
  }
}
