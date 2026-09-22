import { ApiProperty } from '@nestjs/swagger';

export class InvoiceStatusCountsDto {
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) draft!: number;
  @ApiProperty({ type: Number }) issued!: number;
  @ApiProperty({ type: Number }) sent!: number;
  @ApiProperty({ type: Number }) paid!: number;
  @ApiProperty({ type: Number }) cancelled!: number;
}

export class QuoteStatusCountsDto {
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) draft!: number;
  @ApiProperty({ type: Number }) issued!: number;
  @ApiProperty({ type: Number }) sent!: number;
  @ApiProperty({ type: Number }) accepted!: number;
  @ApiProperty({ type: Number }) rejected!: number;
  @ApiProperty({ type: Number }) expired!: number;
}

export class CurrencyAmountDto {
  @ApiProperty({ type: String, example: 'EUR' }) currency!: string;
  @ApiProperty({ type: String, example: '1240.00' }) amount!: string;
  @ApiProperty({ type: Number }) count!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ type: () => InvoiceStatusCountsDto }) invoices!: InvoiceStatusCountsDto;
  @ApiProperty({ type: () => QuoteStatusCountsDto }) quotes!: QuoteStatusCountsDto;
  @ApiProperty({ type: Number }) clients!: number;
  @ApiProperty({ type: () => [CurrencyAmountDto] }) revenueByCurrency!: CurrencyAmountDto[];
  @ApiProperty({ type: () => [CurrencyAmountDto] }) pendingByCurrency!: CurrencyAmountDto[];
}
