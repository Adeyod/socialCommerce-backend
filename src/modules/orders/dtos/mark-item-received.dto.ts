import { IsMongoId } from 'class-validator';

export class MarkItemReceivedDto {
  @IsMongoId()
  orderId!: string;

  @IsMongoId()
  vendorOrderId!: string;

  @IsMongoId()
  itemVendorOrderId!: string;

  @IsMongoId()
  pickupCenterId!: string;

  @IsMongoId()
  businessId!: string;
}
