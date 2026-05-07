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

  // STORE ENHANCEMENT FIELDS
  @Prop()
  logo?: string;

  @Prop()
  banner?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: false })
  isOpen!: boolean;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isActive?: boolean;

  @Prop({
    type: {
      open: String,
      close: String,
    },
  })
  businessHours?: {
    open: string;
    close: string;
  };
}

export const VendorProfileSchema = SchemaFactory.createForClass(VendorProfile);
