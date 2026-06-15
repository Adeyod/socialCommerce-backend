import { IsArray, IsMongoId } from 'class-validator';

export class SendItemsDto {
  @IsMongoId()
  orderId!: string;

  @IsArray()
  items!: {
    productId: string;
    quantity: number;
  }[];
}

export class BulkSendToPickupDto {
  @IsMongoId()
  pickupCenterId!: string;

  @IsArray()
  payload!: SendItemsDto[];
}
