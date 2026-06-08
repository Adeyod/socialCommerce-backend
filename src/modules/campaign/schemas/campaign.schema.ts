import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  CampaignScope,
  CampaignType,
  DiscountType,
} from '../enums/campaign.enum';

export type CampaignDocument = HydratedDocument<Campaign>;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ enum: CampaignType, required: true })
  type!: CampaignType;

  @Prop({ enum: CampaignScope, required: true })
  scope!: CampaignScope;

  // PROMOTION FIELDS
  @Prop({ enum: DiscountType })
  discountType?: DiscountType;

  @Prop()
  discountValue?: number;

  // REWARD FIELDS
  @Prop()
  thresholdAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  rewardProductId?: Types.ObjectId;

  @Prop()
  rewardQuantity?: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
