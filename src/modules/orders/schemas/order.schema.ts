import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  paid = 'paid',
  pending = 'pending',
  processing = 'processing',
  ready_for_delivery = 'ready_for_delivery',
  in_delivery = 'in_delivery',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum VendorOrderStatus {
  pending = 'pending',
  processing = 'processing',
  ready = 'ready',
}

@Schema({ timestamps: true })
export class Order {
  // 👤 Customer
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId!: Types.ObjectId;

  // 🏪 MULTI-VENDOR STRUCTURE
  @Prop({
    type: [
      {
        vendorId: {
          type: Types.ObjectId,
          ref: 'Business',
          required: true,
        },

        items: [
          {
            productId: {
              type: Types.ObjectId,
              ref: 'Product',
              required: true,
            },
            name: { type: String, required: true }, // snapshot
            price: { type: Number, required: true }, // snapshot
            quantity: { type: Number, required: true },
          },
        ],

        subtotal: { type: Number, required: true },

        status: {
          type: String,
          enum: ['PENDING', 'PROCESSING', 'READY'],
          default: 'PENDING',
        },
      },
    ],
    required: true,
  })
  vendorOrders!: {
    vendorId: Types.ObjectId;
    items: {
      productId: Types.ObjectId;
      name: string;
      price: number;
      quantity: number;
    }[];
    subtotal: number;
    status: VendorOrderStatus;
  }[];

  // GLOBAL PRICING
  @Prop({ required: true })
  subtotal!: number;

  @Prop({ default: 0 })
  deliveryFee!: number;

  @Prop({ required: true })
  total!: number;

  // Delivery
  @Prop({ required: true })
  deliveryAddress!: string;

  @Prop({ required: true })
  contactPhone!: string;

  // DELIVERY LINK (can later support multiple)
  @Prop({ type: [Types.ObjectId], ref: 'Delivery', default: [] })
  deliveryIds!: Types.ObjectId[];

  // Payment
  @Prop({ default: false })
  isPaid!: boolean;

  @Prop()
  paidAt?: Date;

  // ORDER STATUS (GLOBAL)
  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.pending,
  })
  status!: OrderStatus;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
