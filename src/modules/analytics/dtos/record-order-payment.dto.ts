import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RecordOrderPaymentDto {
  @IsNotEmpty()
  @IsString()
  businessId!: string;

  @IsNumber()
  @Min(1)
  revenue!: number;

  @IsNumber()
  @Min(1)
  productsSold!: number;

  @IsNotEmpty()
  @IsString()
  customerId!: string;
}
