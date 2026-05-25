import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RiderProfileDocument = HydratedDocument<RiderProfile>;

export class RiderServiceArea {
  @Prop({ required: true })
  name!: string; // Ikeja

  @Prop()
  state?: string; // optional: "Lagos"

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
export class RiderProfile {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop()
  vehicleType!: string;

  @Prop()
  licenseNumber!: string;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      // required: true,
    },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: [RiderServiceArea],
    default: [],
  })
  serviceAreas!: RiderServiceArea[];
}

export const RiderProfileSchema = SchemaFactory.createForClass(RiderProfile);
RiderProfileSchema.index({ location: '2dsphere' });
