import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const API_KEY_SCOPES = [
  'invoices:read',
  'quotes:read',
  'clients:read',
  'companies:read',
] as const;

export class CreateApiCredentialDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({ enum: API_KEY_SCOPES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(API_KEY_SCOPES.length)
  @IsIn(API_KEY_SCOPES, { each: true })
  scopes!: (typeof API_KEY_SCOPES)[number][];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  allowedCompanyIds?: string[];

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  expiresAt?: string;
}

export class RotateApiCredentialDto {
  @ApiProperty({ enum: API_KEY_SCOPES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(API_KEY_SCOPES.length)
  @IsIn(API_KEY_SCOPES, { each: true })
  scopes!: (typeof API_KEY_SCOPES)[number][];

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  expiresAt?: string;
}

export class ApiCredentialResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) clientId!: string;
  @ApiProperty({ type: String }) clientName!: string;
  @ApiProperty({ type: [String], format: 'uuid' }) allowedCompanyIds!: string[];
  @ApiProperty({ type: String, format: 'uuid' }) keyId!: string;
  @ApiProperty({ type: String }) prefix!: string;
  @ApiProperty({ type: [String], enum: API_KEY_SCOPES }) scopes!: string[];
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) expiresAt!:
    string | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) revokedAt!:
    string | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) lastUsedAt!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class CreatedApiCredentialResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) clientId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) keyId!: string;
  @ApiProperty({ type: String, description: 'Shown once. It cannot be recovered later.' })
  apiKey!: string;
}
