import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
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

export class DeliveryAddressDto {
  @ApiProperty()
  @IsString()
  street!: string;

  @ApiProperty()
  @IsString()
  state!: NigeriaState;

  @ApiProperty()
  @IsString()
  town!: string;

  @ApiProperty()
  @IsString()
  country?: string;
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

  @ApiProperty({
    description: 'Delivery address compulsory',
  })
  @IsString()
  deliveryAddress!: DeliveryAddressDto;

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

  @ApiPropertyOptional({
    description: 'Nearest bus stop',
  })
  @IsOptional()
  @IsString()
  nearestBusStop?: string;
}
