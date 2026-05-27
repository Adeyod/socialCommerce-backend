import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum DeliveryMode {
  // pickUpFromVendor = 'pickUpFromVendor',
  pickUpFromOurNearestOffice = 'pickUpFromOurNearestOffice',
  homeDelivery = 'homeDelivery',
}

export enum OrderStatus {
  paid = 'paid',
  pending = 'pending',
  processing = 'processing',
  in_transit = 'in_transit',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum VendorOrderStatus {
  pending = 'pending',
  processing = 'processing',
  delivered_to_pickup_center = 'delivered_to_pickup_center',
}

export enum VendorItemOrderStatus {
  pending = 'pending',
  processing = 'processing',
  delivered_to_pickup_center = 'delivered_to_pickup_center',
}

export enum ShipmentStatus {
  pending = 'pending', // waiting for vendors
  collecting = 'collecting', // vendors sending to hub
  in_transit = 'in_transit', // moving between hubs
  arrived = 'arrived', // at destination hub
  out_for_delivery = 'out_for_delivery',
  delivered = 'delivered',
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
    type: [
      {
        _id: { type: Types.ObjectId, auto: true },

        shipmentId: { type: String, required: true },

        // HUBS
        originPickupCenter: {
          type: Types.ObjectId,
          ref: 'PickupCenter',
          required: true,
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
    ],
    required: true,
  })
  shipments!: any[];

  // GLOBAL PRICING
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
  deliveryAddress?: string;

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

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
