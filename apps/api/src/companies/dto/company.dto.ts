import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import {
  isValidSiret,
  NIF_PATTERN,
  PHONE_PATTERN,
  SAFE_SEARCH_PATTERN,
  STAT_PATTERN,
  VAT_NUMBER_PATTERN,
} from '../../common/validation/field-patterns.js';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@ValidatorConstraint({ name: 'isCompanySiret', async: false })
class IsCompanySiretConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidSiret(value);
  }

  defaultMessage(): string {
    return 'siret must be a valid 14-digit SIRET';
  }
}

export class CreateCompanyDto {
  @ApiProperty({ type: String, maxLength: 160 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string | null;

  @ApiPropertyOptional({ type: String, format: 'email', nullable: true })
  @Transform(trimString)
  @IsEmail()
  @MaxLength(254)
  @IsOptional()
  email?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(PHONE_PATTERN)
  @IsOptional()
  phone?: string | null;

  @ApiPropertyOptional({ type: String, format: 'uri', nullable: true, maxLength: 2048 })
  @Transform(trimString)
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  @IsOptional()
  logoUrl?: string | null;

  @ApiPropertyOptional({ enum: ['NONE', 'EU', 'MG'], default: 'NONE' })
  @IsIn(['NONE', 'EU', 'MG'])
  @IsOptional()
  fiscalRegion?: 'NONE' | 'EU' | 'MG';

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Validate(IsCompanySiretConstraint)
  @IsOptional()
  siret?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(VAT_NUMBER_PATTERN)
  @IsOptional()
  vatNumber?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(NIF_PATTERN)
  @IsOptional()
  nif?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(STAT_PATTERN)
  @IsOptional()
  stat?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i)
  @IsOptional()
  iban?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/i)
  @IsOptional()
  bic?: string | null;

  @ApiPropertyOptional({ type: String, default: 'EUR', maxLength: 3 })
  @Transform(trimString)
  @Matches(/^[A-Z]{3}$/)
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({ type: String, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  defaultPaymentMethod?: string;

  @ApiPropertyOptional({ type: String, default: 'INV', maxLength: 12 })
  @Transform(trimString)
  @Matches(/^[A-Z0-9-]{1,12}$/i)
  @IsOptional()
  invoicePrefix?: string;

  @ApiPropertyOptional({ type: String, default: 'DEV', maxLength: 12 })
  @Transform(trimString)
  @Matches(/^[A-Z0-9-]{1,12}$/i)
  @IsOptional()
  quotePrefix?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string | null;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 100 })
  @Transform(trimString)
  @Matches(SAFE_SEARCH_PATTERN)
  @MaxLength(100)
  @IsOptional()
  search?: string;
}

export class CompanyResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) address!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) email!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) logoUrl!: string | null;
  @ApiProperty({ enum: ['NONE', 'EU', 'MG'] }) fiscalRegion!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) siret!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) vatNumber!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) nif!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) stat!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) iban!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) bic!: string | null;
  @ApiProperty({ type: String }) defaultCurrency!: string;
  @ApiProperty({ type: String }) defaultPaymentMethod!: string;
  @ApiProperty({ type: String }) invoicePrefix!: string;
  @ApiProperty({ type: String }) quotePrefix!: string;
  @ApiProperty({ type: Boolean }) isDefault!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class CompanyListResponseDto {
  @ApiProperty({ type: [CompanyResponseDto] }) items!: CompanyResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) limit!: number;
  @ApiProperty({ type: Number }) total!: number;
}
