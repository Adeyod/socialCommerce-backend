import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VendorOrderDocument = HydratedDocument<VendorOrder>;

export enum VendorOrderStatus {
  pending = 'pending',
  processing = 'processing',
  sent_to_pickup_center = 'sent_to_pickup_center',
  received_at_pickup_center = 'received_at_pickup_center',
}

@Schema({ timestamps: true })
export class VendorOrder {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  subtotal!: number;

  @Prop({
    type: String,
    enum: VendorOrderStatus,
    default: VendorOrderStatus.pending,
  })
  status!: VendorOrderStatus;

  // Logistics (optional but useful)
  @Prop()
  shipmentId?: string;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  originPickupCenter?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  destinationPickupCenter?: Types.ObjectId;
}

export const VendorOrderSchema = SchemaFactory.createForClass(VendorOrder);

// Prevent duplicate vendor per order
VendorOrderSchema.index({ orderId: 1, businessId: 1 }, { unique: true });
