import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export type BusinessShippingRateDocument =
  HydratedDocument<BusinessShippingRate>;

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
export class BusinessShippingRate {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  originState!: NigeriaState;

  @Prop({ required: true })
  destinationState!: NigeriaState;

  @Prop({ type: [WeightRangeSchema], default: [] })
  weightRanges!: WeightRange[];
}

export const BusinessShippingRateSchema =
  SchemaFactory.createForClass(BusinessShippingRate);

BusinessShippingRateSchema.index(
  { businessId: 1, destinationState: 1 },
  { unique: true },
);
