import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanFeaturesResponseDto {
  @ApiProperty({ type: Number }) invoicesPerMonth!: number;
  @ApiProperty({ type: Number }) quotesPerMonth!: number;
  @ApiProperty({ type: Number }) companies!: number;
  @ApiProperty({ type: Boolean }) customLogo!: boolean;
  @ApiProperty({ type: Boolean }) emailSending!: boolean;
  @ApiProperty({ type: Boolean }) recurringInvoices!: boolean;
}

export class SubscriptionResponseDto {
  @ApiProperty({ enum: ['free', 'pro', 'business'] }) plan!: 'free' | 'pro' | 'business';
  @ApiProperty({ type: String }) status!: string;
  @ApiProperty({ type: String }) source!: string;
  @ApiProperty({ type: Boolean }) cancelAtPeriodEnd!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'date-time' }) currentPeriodEnd!:
    string | null;
  @ApiProperty({ type: PlanFeaturesResponseDto }) features!: PlanFeaturesResponseDto;
}

export class UsageResponseDto {
  @ApiProperty({ type: Number }) invoices!: number;
  @ApiProperty({ type: Number }) quotes!: number;
  @ApiProperty({ type: Number }) companies!: number;
  @ApiProperty({ type: String, format: 'date-time' }) periodStart!: string;
}
