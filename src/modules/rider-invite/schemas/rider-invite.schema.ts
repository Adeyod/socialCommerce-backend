import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RiderInviteDocument = HydratedDocument<RiderInvite>;

export enum RiderInviteStatus {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
  expired = 'expired',
}

@Schema({ timestamps: true })
export class RiderInvite {
  @Prop({ type: Types.ObjectId, ref: 'PickupCenter', required: true })
  pickupCenterId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  token!: string;

  @Prop({
    enum: RiderInviteStatus,
    default: RiderInviteStatus.pending,
  })
  status!: RiderInviteStatus;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedBy?: Types.ObjectId;
}

export const RiderInviteSchema = SchemaFactory.createForClass(RiderInvite);

// Optional index for fast lookup
RiderInviteSchema.index({ token: 1 });
