import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum DeliveryMode {
  pickUpFromOurNearestOffice = 'pickUpFromOurNearestOffice',
  homeDelivery = 'homeDelivery',
}

export enum OrderStatus {
  pending = 'pending',
  paid = 'paid',
  processing = 'processing',
  completed_at_pickup_center = 'completed_at_pickup_center',
  in_delivery = 'in_delivery',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum ShipmentStatus {
  pending = 'pending', // waiting for vendors
  collecting = 'collecting', // vendors sending to hub
  in_transit = 'in_transit', // moving between hubs
  arrived = 'arrived', // at destination hub
  out_for_delivery = 'out_for_delivery',
  delivered = 'delivered',
  assigned_to_rider = 'assigned_to_rider',
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

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId!: Types.ObjectId;

  @Prop({ required: true })
  subtotal!: number;

  @Prop({ required: true })
  shippingFeeTotal!: number;

  @Prop({ default: 0 })
  deliveryFee!: number;

  @Prop({ required: true })
  total!: number;

  @Prop({ required: true })
  deliveryMode!: DeliveryMode;

  @Prop()
  deliveryAddress?: string;

  @Prop()
  destinationPickupCenter?: Types.ObjectId;

  @Prop({ required: true })
  contactPhone!: string;

  @Prop({ default: false })
  isPaid!: boolean;

  @Prop()
  paidAt?: Date;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.pending,
  })
  status!: OrderStatus;

  @Prop()
  nearestBusStop?: string;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ destinationPickupCenter: 1, isPaid: 1 });
