import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductReviewDocument = HydratedDocument<ProductReview>;

@Schema({ timestamps: true })
export class ProductReview {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ min: 1, max: 5, required: true })
  rating!: number;

  @Prop()
  comment?: string;
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);
