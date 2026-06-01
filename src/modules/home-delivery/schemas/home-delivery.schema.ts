import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export type HomeDeliveryFeeDocument = HydratedDocument<HomeDeliveryFee>;

@Schema({ _id: false })
class WeightRange {
  @Prop({ required: true })
  min!: number;

  @Prop({ type: Number, default: null })
  max!: number | null;

  @Prop({ required: true })
  price!: number;
}

const WeightRangeSchema = SchemaFactory.createForClass(WeightRange);

@Schema({ timestamps: true })
export class HomeDeliveryFee {
  @Prop({ required: true })
  buyerState!: NigeriaState;

  @Prop({ required: true })
  buyerTown!: string;

  @Prop({ required: true })
  nearestBusStop!: string;

  @Prop({ type: Types.ObjectId, ref: 'PickupCenter' })
  pickupCenterId!: Types.ObjectId;

  @Prop({ type: [WeightRangeSchema], default: [] })
  weightRanges!: WeightRange[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const HomeDeliveryFeeSchema =
  SchemaFactory.createForClass(HomeDeliveryFee);
