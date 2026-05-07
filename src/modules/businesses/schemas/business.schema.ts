import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PartnerRole } from '../../partners/enums/partner-role.enum';

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
    enum: PartnerRole,
    isArray: true,
  })
  businessRoles!: PartnerRole[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
