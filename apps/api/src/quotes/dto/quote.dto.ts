import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { CreateClientDto } from '../../clients/dto/client.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import {
  CalculatedInvoiceLineResponseDto as CalculatedDocumentLineResponseDto,
  InvoiceLineDto as DocumentLineDto,
} from '../../invoices/dto/invoice.dto.js';

const DECIMAL_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/;
const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateQuoteDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  companyId!: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ type: CreateClientDto })
  @ValidateNested()
  @Type(() => CreateClientDto)
  @IsOptional()
  client?: CreateClientDto;

  @ApiProperty({ type: [DocumentLineDto], minItems: 1, maxItems: 100 })
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: DocumentLineDto[];

  @ApiProperty({ enum: ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'] })
  @IsIn(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'])
  currency!: 'EUR' | 'USD' | 'GBP' | 'CAD' | 'CHF' | 'MGA';

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  quoteDate!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  validityDate!: string;

  @ApiProperty({ enum: ['none', 'vat', 'withholding'] })
  @IsIn(['none', 'vat', 'withholding'])
  taxMode!: 'none' | 'vat' | 'withholding';

  @ApiProperty({ type: String, example: '20' })
  @Matches(DECIMAL_PATTERN)
  taxRate!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  paymentMethod?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string | null;
}

class UpdateQuoteFields {
  @ApiProperty({ type: [DocumentLineDto], minItems: 1, maxItems: 100 })
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: DocumentLineDto[];

  @ApiProperty({ enum: ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'] })
  @IsIn(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'])
  currency!: CreateQuoteDto['currency'];

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  quoteDate!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  validityDate!: string;

  @ApiProperty({ enum: ['none', 'vat', 'withholding'] })
  @IsIn(['none', 'vat', 'withholding'])
  taxMode!: CreateQuoteDto['taxMode'];

  @ApiProperty({ type: String })
  @Matches(DECIMAL_PATTERN)
  taxRate!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  paymentMethod!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  notes!: string | null;
}

export class UpdateQuoteDto extends PartialType(UpdateQuoteFields) {}

export class QuoteListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'issued', 'sent', 'accepted', 'rejected', 'expired'] })
  @IsIn(['draft', 'issued', 'sent', 'accepted', 'rejected', 'expired'])
  @IsOptional()
  status?: string;
}

export class QuoteResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) draftReference!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) number!: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) companyId!: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) clientId!: string | null;
  @ApiProperty({ type: [CalculatedDocumentLineResponseDto] })
  items!: CalculatedDocumentLineResponseDto[];
  @ApiProperty({ type: String }) currency!: string;
  @ApiProperty({ type: String }) subtotal!: string;
  @ApiProperty({ type: String }) taxAmount!: string;
  @ApiProperty({ type: String }) withholdingAmount!: string;
  @ApiProperty({ type: String }) total!: string;
  @ApiProperty({ type: String }) amountDue!: string;
  @ApiProperty({ type: String }) taxRate!: string;
  @ApiProperty({ enum: ['none', 'vat', 'withholding'] }) taxMode!: string;
  @ApiProperty({ enum: ['legacy-v1', 'v2'] }) calculationVersion!: string;
  @ApiProperty({ type: String }) status!: string;
  @ApiProperty({ type: String, format: 'date' }) quoteDate!: string;
  @ApiProperty({ type: String, format: 'date' }) validityDate!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) paymentMethod!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) issuedAt!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class QuoteListResponseDto {
  @ApiProperty({ type: [QuoteResponseDto] }) items!: QuoteResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) limit!: number;
  @ApiProperty({ type: Number }) total!: number;
}
