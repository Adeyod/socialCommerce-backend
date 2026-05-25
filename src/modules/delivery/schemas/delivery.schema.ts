import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryDocument = HydratedDocument<Delivery>;

export enum DeliveryStatus {
  picked_up = 'picked_up',
  in_transit = 'in_transit',
  delivered = 'delivered',
  cancelled = 'cancelled',
  available = 'available',
  claimed = 'claimed',
}

@Schema({ timestamps: true })
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedRiderId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: DeliveryStatus,
    default: DeliveryStatus.available,
  })
  status!: DeliveryStatus;

  @Prop([
    {
      businessId: {
        type: Types.ObjectId,
        ref: 'Business',
        required: true,
      },

      address: {
        type: String,
        required: true,
      },

      // optional: for partial tracking per vendor
      isPickedUp: {
        type: Boolean,
        default: false,
      },

      pickedUpAt: Date,
    },
  ])
  pickupPoints!: {
    businessId: Types.ObjectId;
    address: string;
    isPickedUp: boolean;
    pickedUpAt?: Date;
  }[];

  @Prop({ required: true })
  dropoffAddress!: string;

  @Prop()
  deliveryFee?: number;

  @Prop()
  claimedAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: null })
  cancelledAt?: Date;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
