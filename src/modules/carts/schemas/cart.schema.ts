import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MediaType } from '../../products/enums/product.enum';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartMedia {
  @Prop({
    type: String,
    enum: Object.values(MediaType),
    required: true,
  })
  type!: MediaType;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  publicUrl!: string;
}

export const CartMediaSchema = SchemaFactory.createForClass(CartMedia);

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

        media: {
          type: [CartMediaSchema],
          default: [],
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        name: { type: String, required: true },
        price: { type: Number, required: true },

        vendorState: { type: String },
        vendorTown: { type: String },

        weight: { type: Number },
      },
    ],
    default: [],
  })
  items!: {
    productId: Types.ObjectId;
    businessId: Types.ObjectId;
    quantity: number;

    media: {
      type: MediaType;
      url: string;
      publicUrl: string;
    }[];

    name: string;
    price: number;

    vendorState: string;
    vendorTown?: string;

    weight?: number;
  }[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
