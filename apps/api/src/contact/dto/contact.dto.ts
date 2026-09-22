import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ContactRequestDto {
  @ApiProperty({ type: String, maxLength: 160 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;
  @ApiProperty({ type: String, format: 'email' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @ApiProperty({ type: String, maxLength: 200 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject!: string;
  @ApiProperty({ type: String, maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
  @ApiPropertyOptional({ type: String, description: 'Spam honeypot. Must remain empty.' })
  @IsString()
  @MaxLength(0)
  @IsOptional()
  website?: string;
}

export class ContactAcceptedDto {
  @ApiProperty({ enum: ['accepted'] }) status!: 'accepted';
}
