import { IsMongoId } from 'class-validator';

export class AttachCampaignDto {
  @IsMongoId()
  campaignId!: string;

  @IsMongoId()
  productId!: string;
}
