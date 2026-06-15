import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
import { OwnershipType } from '../../partners/enums/partner-role.enum';

export type PickupCenterDocument = HydratedDocument<PickupCenter>;

@Schema({ timestamps: true })
export class PickupCenter {
  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  state!: NigeriaState;

  @Prop()
  town?: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  ownershipType!: OwnershipType;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isApproved!: boolean;

  @Prop({ default: false })
  isMainHub!: boolean;

  // OPTIONAL but powerful
  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

export const PickupCenterSchema = SchemaFactory.createForClass(PickupCenter);
