import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CampaignScope,
  CampaignType,
  DiscountType,
} from '../enums/campaign.enum';

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsEnum(CampaignType)
  type!: CampaignType;

  @IsEnum(CampaignScope)
  scope!: CampaignScope;

  // Promotion
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  // Reward
  @IsOptional()
  @IsNumber()
  thresholdAmount?: number;

  @IsOptional()
  @IsMongoId()
  rewardProductId?: string;

  @IsOptional()
  @IsNumber()
  rewardQuantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
