import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
import { DeliveryMode } from '../schemas/order.schema';
import { VendorOrderStatus } from '../schemas/vendor-order.schema';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
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

  @ApiProperty()
  @IsNumber()
  weight!: number;
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

  @ApiPropertyOptional({
    description: 'Total weight of all items from this vendor',
  })
  @IsOptional()
  @IsNumber()
  totalWeight?: number;

  @ApiPropertyOptional({
    description: 'Shipping fee from vendor to pickup center',
  })
  @IsOptional()
  @IsNumber()
  shippingFee?: number;

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

  @ApiProperty({ type: [CreateVendorOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorOrderDto)
  vendorOrders!: CreateVendorOrderDto[];

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

  @ValidateIf((o) => o.deliveryMode === DeliveryMode.pickUpFromOurNearestOffice)
  @ApiPropertyOptional({
    description: 'Pickup center ID (required if pickup selected)',
  })
  @IsString()
  pickupCenter?: string;

  @ApiProperty({
    description: 'Total delivery fee',
  })
  @IsOptional()
  @IsNumber()
  subTotalSummation!: number;

  @ApiProperty({
    description: 'Total delivery fee',
  })
  @IsOptional()
  @IsNumber()
  shippingFeeSummation!: number;

  @ApiPropertyOptional({
    description: 'Total delivery fee',
  })
  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @ApiPropertyOptional({
    description:
      'This is the money that our main state pick up center is going to use to collect goods coming from another state.',
  })
  @IsOptional()
  @IsNumber()
  interStatePickupFee?: number;

  @ValidateIf((o) => o.deliveryMode === DeliveryMode.homeDelivery)
  @ApiPropertyOptional({
    description: 'Delivery address compulsory',
  })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional({
    description: 'Nearest bus stop',
  })
  @IsOptional()
  @IsString()
  nearestBusStop?: string;
}
