import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PartnerRole } from '../../partners/enums/partner-role.enum';

export type PopulatedBusinessOwner = {
  _id: Types.ObjectId;
  businessName: string;
  ownerId: {
    email: string;
    _id: Types.ObjectId;
  };
};

export type BusinessDocument = HydratedDocument<Business>;

export type BusinessWithOwner = Omit<BusinessDocument, 'ownerId'> & {
  ownerId: {
    _id: Types.ObjectId;
    email: string;
  };
};

export class BusinessAddress {
  @Prop({ required: true })
  street!: string; // Ikeja

  @Prop()
  state!: string; // optional: "Lagos"

  @Prop()
  town!: string; // optional: "Lagos"

  @Prop()
  country?: string; // optional: "Nigeria"

  @Prop()
  code?: string; // ikeja-lagos

  @Prop()
  centerLat?: number;

  @Prop()
  centerLng?: number;

  @Prop()
  radiusKm?: number; // e.g. 5km coverage
}

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true, ref: 'User', type: Types.ObjectId })
  ownerId!: Types.ObjectId;

  @Prop({ required: true })
  businessName!: string;

  @Prop()
  businessAddress?: BusinessAddress;

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
