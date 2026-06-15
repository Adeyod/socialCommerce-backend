import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Shipment } from '../types/order.types';

export type OrderDocument = HydratedDocument<Order>;

export enum DeliveryMode {
  pickUpFromOurNearestOffice = 'pickUpFromOurNearestOffice',
  homeDelivery = 'homeDelivery',
}

export enum OrderStatus {
  pending = 'pending',
  paid = 'paid',
  processing = 'processing',
  // ready_at_pickup_center = 'ready_at_pickup_center',
  completed_at_pickup_center = 'completed_at_pickup_center',
  in_delivery = 'in_delivery',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum VendorOrderStatus {
  pending = 'pending',
  processing = 'processing',
  sent_to_pickup_center = 'sent_to_pickup_center',
  received_at_pickup_center = 'received_at_pickup_center',
}

export enum VendorItemOrderStatus {
  pending = 'pending',
  processing = 'processing',
  sent_to_pickup_center = 'sent_to_pickup_center',
  received_at_pickup_center = 'received_at_pickup_center',
}

export enum ShipmentStatus {
  pending = 'pending', // waiting for vendors
  collecting = 'collecting', // vendors sending to hub
  in_transit = 'in_transit', // moving between hubs
  arrived = 'arrived', // at destination hub
  out_for_delivery = 'out_for_delivery',
  delivered = 'delivered',
}

export class DeliveryAddress {
  @Prop()
  street?: string; // Ikeja

  @Prop()
  state?: string; // optional: "Lagos"

  @Prop()
  town?: string; // optional: "Lagos"

  @Prop()
  country?: string; // optional: "Nigeria"

  @Prop()
  code?: string; // ikeja-lagos

  @Prop()
  centerLat?: number;

  @Prop()
  centerLng?: number;

  @Prop()
  radiusKm?: number; // e.g. 5km coverage
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ unique: true, required: true })
  idempotencyKey!: string;

  // Customer
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId!: Types.ObjectId;

  @Prop()
  pickupCenter?: string;

  // DELIVERY LINK (can later support multiple)
  @Prop({ type: [Types.ObjectId], ref: 'Delivery', default: [] })
  deliveryIds!: Types.ObjectId[];

  // SHIPMENTS (CORE LOGIC)
  @Prop({
    type: {
      _id: { type: Types.ObjectId, auto: true },

      shipmentId: { type: String, required: true },

      // HUBS
      originPickupCenter: {
        type: Types.ObjectId,
        ref: 'PickupCenter',
      },

      destinationPickupCenter: {
        type: Types.ObjectId,
        ref: 'PickupCenter',
      },

      deliveryMode: {
        type: String,
        enum: DeliveryMode,
        required: true,
      },

      // VENDORS INSIDE SHIPMENT
      vendors: [
        {
          _id: { type: Types.ObjectId, auto: true },

          businessId: {
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
              name: { type: String, required: true },
              price: { type: Number, required: true },
              quantity: { type: Number, required: true },

              itemStatus: {
                type: String,
                enum: VendorItemOrderStatus,
                default: VendorItemOrderStatus.pending,
              },
            },
          ],

          subtotal: { type: Number, required: true },

          status: {
            type: String,
            enum: VendorOrderStatus,
            default: VendorOrderStatus.pending,
          },
        },
      ],

      subtotal: { type: Number, required: true },

      deliveryFee: { type: Number, default: 0 },

      status: {
        type: String,
        enum: ShipmentStatus,
        default: ShipmentStatus.pending,
      },
    },

    required: true,
  })
  shipment!: Shipment;

  // GLOBAL PRICING
  @Prop({ required: true })
  shippingFeeTotal!: number;

  @Prop({ required: true })
  subtotal!: number;

  @Prop({ default: 0 })
  deliveryFee!: number; // sum of all shipments

  @Prop({ required: true })
  total!: number;

  // DELIVERY DETAILS
  @Prop({ required: true })
  deliveryMode!: DeliveryMode;

  @Prop()
  deliveryAddress?: DeliveryAddress;

  @Prop()
  destinationPickupCenter?: Types.ObjectId;

  @Prop({ required: true })
  contactPhone!: string;

  // PAYMENT
  @Prop({ default: false })
  isPaid!: boolean;

  @Prop()
  paidAt?: Date;

  // ORDER STATUS
  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.pending,
  })
  status!: OrderStatus;

  @Prop({ default: 0 })
  collectionFee!: number;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
