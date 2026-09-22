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
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateClientDto } from '../../clients/dto/client.dto.js';

const DECIMAL_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/;
const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class InvoiceLineDto {
  @ApiProperty({ type: String, maxLength: 500 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({ type: String, example: '1' })
  @Matches(DECIMAL_PATTERN)
  quantity!: string;

  @ApiProperty({ type: String, example: '1000.00' })
  @Matches(DECIMAL_PATTERN)
  unitPrice!: string;
}

export class CreateInvoiceDto {
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

  @ApiProperty({ type: [InvoiceLineDto], minItems: 1, maxItems: 100 })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: InvoiceLineDto[];

  @ApiProperty({ enum: ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'] })
  @IsIn(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'])
  currency!: 'EUR' | 'USD' | 'GBP' | 'CAD' | 'CHF' | 'MGA';

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  invoiceDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsDateString({ strict: true })
  @IsOptional()
  dueDate?: string | null;

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

class UpdateInvoiceFields {
  @ApiProperty({ type: [InvoiceLineDto], minItems: 1, maxItems: 100 })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: InvoiceLineDto[];

  @ApiProperty({ enum: ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'] })
  @IsIn(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA'])
  currency!: 'EUR' | 'USD' | 'GBP' | 'CAD' | 'CHF' | 'MGA';

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString({ strict: true })
  invoiceDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsDateString({ strict: true })
  dueDate!: string | null;

  @ApiProperty({ enum: ['none', 'vat', 'withholding'] })
  @IsIn(['none', 'vat', 'withholding'])
  taxMode!: 'none' | 'vat' | 'withholding';

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

export class UpdateInvoiceDto extends PartialType(UpdateInvoiceFields) {}

export class InvoiceListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'issued', 'sent', 'paid', 'cancelled'] })
  @IsIn(['draft', 'issued', 'sent', 'paid', 'cancelled'])
  @IsOptional()
  status?: string;
}

export class CalculatedInvoiceLineResponseDto extends InvoiceLineDto {
  @ApiPropertyOptional({ type: String, nullable: true }) id!: string | null;
  @ApiProperty({ type: String }) total!: string;
}

export class InvoiceResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) draftReference!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) number!: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) companyId!: string | null;
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true }) clientId!: string | null;
  @ApiProperty({ type: String }) companyName!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) companyAddress!: string | null;
  @ApiProperty({ type: String, format: 'email' }) companyEmail!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) companyPhone!: string | null;
  @ApiProperty({ type: String }) clientName!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) clientAddress!: string | null;
  @ApiProperty({ type: String, format: 'email' }) clientEmail!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) clientPhone!: string | null;
  @ApiProperty({ type: [CalculatedInvoiceLineResponseDto] })
  items!: CalculatedInvoiceLineResponseDto[];
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
  @ApiProperty({ type: String, format: 'date' }) invoiceDate!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) dueDate!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) paymentMethod!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) issuedAt!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class InvoiceListResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] }) items!: InvoiceResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) limit!: number;
  @ApiProperty({ type: Number }) total!: number;
}
