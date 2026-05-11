import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductAnalyticsDocument = HydratedDocument<ProductAnalytics>;

@Schema({ timestamps: true })
export class ProductAnalytics {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ default: 0 })
  views!: number;

  @Prop({ default: 0 })
  purchases!: number;

  @Prop({ default: 0 })
  clicks!: number;
}

export const ProductAnalyticsSchema =
  SchemaFactory.createForClass(ProductAnalytics);
