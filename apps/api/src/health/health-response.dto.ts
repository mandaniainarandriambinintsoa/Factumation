import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponse {
  @ApiProperty({ type: String, example: 'ok' })
  status!: 'ok';

  @ApiProperty({ type: String, example: 'factumation-api' })
  service!: 'factumation-api';
}

export class ReadinessResponse extends LivenessResponse {
  @ApiProperty({
    type: Object,
    example: { auth: 'up', dataApi: 'up' },
    additionalProperties: { type: 'string', enum: ['up'] },
  })
  dependencies!: {
    auth: 'up';
    dataApi: 'up';
  };
}
