import { IsArray, IsMongoId } from 'class-validator';

export class BulkSendToPickupDto {
  @IsArray()
  @IsMongoId({ each: true })
  orderIds!: string[];
}
