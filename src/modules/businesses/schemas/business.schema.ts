import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum BusinessRole {
  vendor = 'vendor',
  rider = 'rider',
  promoter = 'promoter',
}
export type BusinessDocument = HydratedDocument<Business>;

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true, ref: 'User', type: Types.ObjectId })
  ownerId!: Types.ObjectId;

  @Prop({ required: true })
  businessName!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({
    type: [String],
    enum: BusinessRole,
    isArray: true,
  })
  businessRoles!: BusinessRole[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
