import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
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

@ValidatorConstraint({ name: 'isSiret', async: false })
class IsSiretConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidSiret(value);
  }

  defaultMessage(): string {
    return 'siret must be a valid 14-digit SIRET';
  }
}

export class CreateClientDto {
  @ApiProperty({ type: String, maxLength: 160 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ type: String, format: 'email', maxLength: 254 })
  @Transform(trimString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Matches(PHONE_PATTERN)
  @IsOptional()
  phone?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 160 })
  @Transform(trimString)
  @IsString()
  @MaxLength(160)
  @IsOptional()
  companyName?: string | null;

  @ApiPropertyOptional({ enum: ['NONE', 'EU', 'MG'], default: 'NONE' })
  @IsIn(['NONE', 'EU', 'MG'])
  @IsOptional()
  fiscalRegion?: 'NONE' | 'EU' | 'MG';

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(trimString)
  @Validate(IsSiretConstraint)
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

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string | null;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class ClientListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, minLength: 1, maxLength: 100 })
  @Transform(trimString)
  @Matches(SAFE_SEARCH_PATTERN)
  @MaxLength(100)
  @IsOptional()
  search?: string;
}

export class ClientResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, format: 'email' }) email!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) address!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) companyName!: string | null;
  @ApiProperty({ enum: ['NONE', 'EU', 'MG'] }) fiscalRegion!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) siret!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) vatNumber!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) nif!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) stat!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class ClientListResponseDto {
  @ApiProperty({ type: [ClientResponseDto] }) items!: ClientResponseDto[];
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) limit!: number;
  @ApiProperty({ type: Number }) total!: number;
}
