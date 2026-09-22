import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthPrincipalResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, example: 'authenticated' })
  role!: string;

  @ApiPropertyOptional({ type: String, format: 'email' })
  email?: string;

  @ApiPropertyOptional({ type: String })
  phone?: string;
}
