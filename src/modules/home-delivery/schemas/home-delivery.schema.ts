import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HomeDeliveryFeeDocument = HydratedDocument<HomeDeliveryFee>;

@Schema({ timestamps: true })
export class HomeDeliveryFee {
  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  town!: string;

  @Prop({ required: true })
  nearestBusStop!: string;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  pickupCenterId!: Types.ObjectId;

  @Prop([
    {
      min: Number,
      max: Number,
      price: Number,
    },
  ])
  weightRanges!: {
    min: number;
    max: number;
    price: number;
  }[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const HomeDeliveryFeeSchema =
  SchemaFactory.createForClass(HomeDeliveryFee);
