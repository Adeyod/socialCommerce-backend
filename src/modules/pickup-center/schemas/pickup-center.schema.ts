import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PickupCenterDocument = HydratedDocument<PickupCenter>;

@Schema({ timestamps: true })
export class PickupCenter {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  state!: string;

  @Prop()
  town?: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isMainHub!: boolean;

  // OPTIONAL but powerful
  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

export const PickupCenterSchema = SchemaFactory.createForClass(PickupCenter);
