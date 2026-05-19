import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RiderProfileDocument = HydratedDocument<RiderProfile>;

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
}

export const RiderProfileSchema = SchemaFactory.createForClass(RiderProfile);
