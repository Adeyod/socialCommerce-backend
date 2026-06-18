import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum NotificationType {
  order_paid = 'order_paid',
  all_vendor_package_in_an_order_received_by_pickup_center = 'all_vendor_package_in_an_order_received_by_pickup_center',
  order_sent_to_pickup_center_by_vendor = 'order_sent_to_pickup_center_by_vendor',
  order_packed = 'order_packed',
  order_ready_for_delivery = 'order_ready_for_delivery',
  order_assigned_to_rider = 'order_assigned_to_rider',
  order_ready_for_pickup = 'order_ready_for_pickup',
  new_shipment_alert = 'new_shipment_alert',
}

export enum NotificationStatus {
  unread = 'unread',
  read = 'read',
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type!: NotificationType;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  message!: string;

  // optional links
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  pickupCenterId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Delivery' })
  deliveryId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.unread,
  })
  status!: NotificationStatus;

  @Prop({ type: [Types.ObjectId], default: [] })
  readBy!: Types.ObjectId[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
