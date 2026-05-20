import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: {
          type: Types.ObjectId,
          ref: 'Product',
          required: true,
        },

        businessId: {
          type: Types.ObjectId,
          ref: 'Business',
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    default: [],
  })
  items!: {
    productId: Types.ObjectId;
    businessId: Types.ObjectId;
    quantity: number;
  }[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
