import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  price!: number;

  @Prop()
  description!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
