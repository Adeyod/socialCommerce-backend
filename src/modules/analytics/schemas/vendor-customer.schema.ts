import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VendorCustomerDocument = HydratedDocument<VendorCustomer>;

@Schema({ timestamps: true })
export class VendorCustomer {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  customerId!: Types.ObjectId;
}

export const VendorCustomerSchema =
  SchemaFactory.createForClass(VendorCustomer);

VendorCustomerSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
