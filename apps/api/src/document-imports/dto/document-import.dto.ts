import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import type { DocumentKind } from '@factumation/contracts';

export class DocumentImportContextDto {
  @ApiProperty({ enum: ['invoice', 'quote'] })
  @IsIn(['invoice', 'quote'])
  kind!: DocumentKind;
}

export class DocumentImportResponseDto {
  @ApiProperty({ type: String, enum: ['image', 'voice'] })
  source!: 'image' | 'voice';

  @ApiProperty({ type: Object })
  draft!: Record<string, unknown>;

  @ApiProperty({ type: String, nullable: true })
  transcript!: string | null;

  @ApiProperty({ type: Number, minimum: 0, maximum: 1 })
  confidence!: number;

  @ApiProperty({ type: () => [String] })
  warnings!: string[];
}
