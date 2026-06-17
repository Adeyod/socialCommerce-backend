import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  DeliveryMode,
  ShipmentStatus,
} from '../../orders/schemas/order.schema';
import { ShipmentVendor } from '../../orders/types/order.types';

export type ShipmentEntityDocument = HydratedDocument<ShipmentEntity>;

@Schema({ timestamps: true })
export class ShipmentEntity {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter', required: true })
  originPickupCenter?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  destinationPickupCenter?: Types.ObjectId;

  @Prop({ required: true, enum: DeliveryMode })
  deliveryMode!: DeliveryMode;

  @Prop({ type: Array, required: true })
  vendors!: ShipmentVendor[];

  @Prop({ required: true })
  subtotal!: number;

  @Prop({ required: true })
  deliveryFee?: number;

  @Prop({ enum: ShipmentStatus, default: ShipmentStatus.pending })
  status!: ShipmentStatus;
}

export const ShipmentEntitySchema =
  SchemaFactory.createForClass(ShipmentEntity);
