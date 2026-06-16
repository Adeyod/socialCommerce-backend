import { IsArray, IsMongoId } from 'class-validator';

export class SendItemsToPickupDto {
  @IsMongoId()
  itemVendorOrderId!: string;
}

export class BulkSendToPickupDto {
  @IsMongoId()
  pickupCenterId!: string;

  @IsArray()
  payload!: SendItemsToPickupDto[];
}
