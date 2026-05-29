import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessShippingRateDocument =
  HydratedDocument<BusinessShippingRate>;

@Schema({ timestamps: true })
export class BusinessShippingRate {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  originState!: string;

  @Prop([
    {
      destinationState: { type: String, required: true },

      weightRanges: [
        {
          min: Number,
          max: Number,
          price: Number,
        },
      ],
    },
  ])
  priceBreakdown!: {
    destinationState: string;
    weightRanges: {
      min: number;
      max: number;
      price: number;
    }[];
  }[];
}

export const BusinessShippingRateSchema =
  SchemaFactory.createForClass(BusinessShippingRate);
