// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, Types } from 'mongoose';
// import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

// export type RiderProfileDocument = HydratedDocument<RiderProfile>;

// export class RiderServiceArea {
//   @Prop({ required: true })
//   name!: string; // Ikeja

//   @Prop()
//   state?: NigeriaState; // optional: "Lagos"

//   @Prop()
//   country?: string; // optional: "Nigeria"

//   @Prop()
//   code?: string; // ikeja-lagos

//   @Prop()
//   centerLat?: number;

//   @Prop()
//   centerLng?: number;

//   @Prop()
//   radiusKm?: number; // e.g. 5km coverage
// }

// @Schema({ timestamps: true })
// export class RiderProfile {
//   @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
//   businessId!: string;

//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   userId!: Types.ObjectId;

//   @Prop()
//   vehicleType!: string;

//   @Prop()
//   riderLocationState?: NigeriaState;

//   @Prop()
//   licenseNumber!: string;

//   @Prop({ default: true })
//   isAvailable!: boolean;

//   @Prop({
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point',
//     },
//     coordinates: {
//       type: [Number], // [lng, lat]
//       // required: true,
//     },
//   })
//   location?: {
//     type: string;
//     coordinates: number[];
//   };

//   @Prop({
//     type: [RiderServiceArea],
//     default: [],
//   })
//   serviceAreas!: RiderServiceArea[];

//   @Prop({
//     type: [String],
//     default: [],
//   })
//   riderRoutes!: string[];
// }

// export const RiderProfileSchema = SchemaFactory.createForClass(RiderProfile);
// RiderProfileSchema.index({ location: '2dsphere' });
// RiderProfileSchema.index({ riderRoutes: 1, riderLocationState: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RiderProfileDocument = HydratedDocument<RiderProfile>;

export enum RiderStatus {
  active = 'active',
  inactive = 'inactive',
  suspended = 'suspended',
}

@Schema({ timestamps: true })
export class RiderProfile {
  // Link to the main user account
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  // Pickup center the rider belongs to
  @Prop({ type: Types.ObjectId, ref: 'PickupCenter', required: true })
  pickupCenterId!: Types.ObjectId;

  // Rider availability (for dispatch system later)
  @Prop({ default: true })
  isAvailable!: boolean;

  // Status control (admin/pickup center control)
  @Prop({
    enum: RiderStatus,
    default: RiderStatus.active,
  })
  status!: RiderStatus;

  // Performance tracking (optional but powerful)
  @Prop({ default: 0 })
  totalDeliveries!: number;

  @Prop({ default: 0 })
  rating!: number;

  // Rider details (optional but useful)
  @Prop()
  vehicleType?: string; // bike, car, van

  @Prop()
  licenseNumber?: string;

  // Last known location (for live tracking later)
  @Prop({
    type: {
      lat: Number,
      lng: Number,
    },
  })
  currentLocation?: {
    lat: number;
    lng: number;
  };

  // Who approved this rider (optional admin audit)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const RiderProfileSchema = SchemaFactory.createForClass(RiderProfile);

RiderProfileSchema.index({ pickupCenterId: 1 });
RiderProfileSchema.index({ status: 1 });
