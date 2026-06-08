import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductCampaign {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ProductCampaignSchema =
  SchemaFactory.createForClass(ProductCampaign);
