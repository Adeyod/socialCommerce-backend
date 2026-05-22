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
  businessId!: string;

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
  @ApiProperty({
    description: 'This is the ID of the buyer.',
  })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [CreateVendorOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorOrderDto)
  vendorOrders!: CreateVendorOrderDto[];

  @ApiProperty({
    description: 'This is the overall total of all the products.',
  })
  @IsNumber()
  subtotal!: number; //the overall total of products summed together

  @ApiProperty({
    description: 'This is the delivery fee for rider.',
  })
  @IsNumber()
  deliveryFee!: number;

  @ApiProperty({
    description:
      'This is the actual amount that customer is going to pay which is the products cost plus delivery fees and if there is tax, it will be added.',
  })
  @IsNumber()
  total!: number; // this is the amount that the customer will eventually pay. Delivery fee added, taxes(if any) as well as if there is discount.

  @ApiProperty({
    description:
      'This is the address that the customer want the products to be delivered to.',
  })
  @IsString()
  deliveryAddress!: string;

  @ApiProperty({
    description:
      'This is a unique number per request. This is locked to the order so that even if user click the create order button twice, we wont be processing the order twice.',
  })
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({ description: 'This si the phone number of the customer' })
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
