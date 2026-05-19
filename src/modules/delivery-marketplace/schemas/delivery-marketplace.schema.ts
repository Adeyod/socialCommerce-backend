import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryMarketplaceDocument = HydratedDocument<DeliveryMarketplace>;

export enum DeliveryMarketplaceStatus {
  open = 'open',
  assigned = 'assigned',
  picked_up = 'picked_up',
  in_transit = 'in_transit',
  delivered = 'delivered',
  cancelled = 'cancelled',
}

@Schema({ timestamps: true })
export class DeliveryMarketplace {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  vendorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedRiderId?: Types.ObjectId;

  @Prop({ required: true })
  pickup!: string;

  @Prop({ required: true })
  dropoff!: string;

  @Prop({ required: true })
  distance!: number;

  @Prop({ required: true })
  fee!: number;

  @Prop({
    type: String,
    enum: DeliveryMarketplaceStatus,
    default: DeliveryMarketplaceStatus.open,
  })
  status!: DeliveryMarketplaceStatus;

  @Prop({ default: null })
  acceptedAt?: Date;

  @Prop({ default: null })
  deliveredAt?: Date;

  @Prop({ default: null })
  cancelledAt?: Date;
}

export const DeliveryMarketplaceSchema =
  SchemaFactory.createForClass(DeliveryMarketplace);
