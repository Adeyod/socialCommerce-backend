import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromoterProfileDocument = HydratedDocument<PromoterProfile>;

@Schema({ timestamps: true })
export class PromoterProfile {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  referralCode!: string;
}

export const PromoterProfileSchema =
  SchemaFactory.createForClass(PromoterProfile);
