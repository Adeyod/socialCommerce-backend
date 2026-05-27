import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DeliveryMode, VendorOrderStatus } from '../schemas/order.schema';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsString()
  businessId!: string;
}

export class VendorOrderItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  price!: number;
}

export class CreateVendorOrderDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiProperty({ type: [VendorOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorOrderItemDto)
  items!: VendorOrderItemDto[];

  @ApiProperty()
  @IsNumber()
  subtotal!: number;

  @ApiProperty({ default: VendorOrderStatus.pending })
  @IsOptional()
  @IsString()
  status?: VendorOrderStatus;
}

// export class CreateOrderDto {
//   @ApiProperty({
//     description: 'This is the ID of the cart of the buyer.',
//   })
//   @IsString()
//   cartId!: string;

//   @ApiProperty({
//     description: 'This is the ID of the buyer.',
//   })
//   @IsString()
//   customerId!: string;

//   @ApiProperty({ type: [CreateOrderItemDto] })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateOrderItemDto)
//   items!: CreateOrderItemDto[];

//   @ApiProperty({
//     description: 'This is the delivery fee for rider.',
//   })
//   @IsNumber()
//   deliveryFee!: number;

//   @ApiProperty({
//     description:
//       'This is the address that the customer want the products to be delivered to.',
//   })
//   @Transform(({ value }) => value?.toString().trim())
//   @IsNotEmpty()
//   @IsString()
//   deliveryAddress!: string;

//   @ApiProperty({
//     description:
//       'This is a unique number per request. This is locked to the order so that even if user click the create order button twice, we wont be processing the order twice.',
//   })
//   @IsString()
//   idempotencyKey!: string;

//   @ApiProperty({ description: 'This si the phone number of the customer' })
//   @IsString()
//   contactPhone!: string;

//   @ApiProperty({
//     description: 'This refer to the mode of receiving the purchased products.',
//     example: DeliveryMode.pickUpFromOurNearestOffice,
//   })
//   @IsString()
//   deliveryMode!: DeliveryMode;

//   @ApiPropertyOptional({
//     description: 'This is one of our offices closest to the buyer address.',
//     example: 'Adebayo Office',
//   })
//   @IsString()
//   pickupCenter?: string;
// }
export class CreateOrderDto {
  @ApiProperty({
    description: 'Cart ID of the buyer',
  })
  @IsString()
  cartId!: string;

  @ApiProperty({
    description: 'Customer ID',
  })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Total delivery fee',
  })
  @IsNumber()
  deliveryFee!: number;

  @ApiPropertyOptional({
    description: 'Delivery address (required for home delivery)',
  })
  @Transform(({ value }) => value?.toString().trim())
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({
    description: 'Unique idempotency key',
  })
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({
    description: 'Customer phone number',
  })
  @IsString()
  contactPhone!: string;

  @ApiProperty({
    description: 'Delivery mode',
    enum: DeliveryMode,
  })
  @IsString()
  deliveryMode!: DeliveryMode;

  @ApiPropertyOptional({
    description: 'Pickup center ID (required if pickup selected)',
  })
  @IsOptional()
  @IsString()
  pickupCenter?: string;
}
