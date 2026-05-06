import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VendorProfileDocument = HydratedDocument<VendorProfile>;

@Schema({ timestamps: true })
export class VendorProfile {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  storeName!: string;

  @Prop()
  description!: string;
}

export const VendorProfileSchema = SchemaFactory.createForClass(VendorProfile);
