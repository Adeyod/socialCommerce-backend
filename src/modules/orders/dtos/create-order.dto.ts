import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { VendorOrderStatus } from '../schemas/order.schema';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiProperty()
  @IsNumber()
  quantity!: number;
}

export class CreateVendorOrderDto {
  @ApiProperty()
  @IsString()
  vendorId!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty()
  @IsNumber()
  subtotal!: number;

  @ApiProperty({ default: VendorOrderStatus.pending })
  @IsOptional()
  @IsString()
  status?: VendorOrderStatus;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [CreateVendorOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorOrderDto)
  vendorOrders!: CreateVendorOrderDto[];

  @ApiProperty()
  @IsNumber()
  subtotal!: number; //the overall total of products summed together

  @ApiProperty()
  @IsNumber()
  deliveryFee!: number;

  @ApiProperty()
  @IsNumber()
  total!: number; // this is the amount that the customer will eventually pay. Delivery fee added, taxes(if any) as well as if there is discount.

  @ApiProperty()
  @IsString()
  deliveryAddress!: string;

  @ApiProperty()
  @IsString()
  contactPhone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
