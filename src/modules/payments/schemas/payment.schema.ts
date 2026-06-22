import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  DeliveryAddress,
  DeliveryMode,
} from '../../orders/schemas/order.schema';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  pending = 'pending',
  successful = 'successful',
  failed = 'failed',
  expired = 'expired',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  // FLUTTERWAVE = 'flutterwave',
}
// @Schema({ timestamps: true })
// export class Payment {
//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   userId!: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
//   orderId!: Types.ObjectId;

//   @Prop({ required: true })
//   expiresAt!: Date;

//   @Prop({ default: false })
//   isExpired!: boolean;

//   @Prop({ required: true })
//   amount!: number; // store in kobo

//   @Prop({ required: true, unique: true })
//   reference!: string; // internal reference

//   @Prop()
//   providerReference!: string; // paystack or other provider reference

//   @Prop()
//   authorizationUrl!: string; // paystack or other provider authorization_url

//   @Prop({
//     type: String,
//     enum: PaymentProvider,
//     default: PaymentProvider.PAYSTACK,
//   })
//   provider!: PaymentProvider;

//   @Prop({
//     type: String,
//     enum: PaymentStatus,
//     default: PaymentStatus.pending,
//   })
//   status!: PaymentStatus;

//   @Prop({
//     default: false,
//   })
//   verified!: boolean;

//   @Prop({ type: Object })
//   metadata!: Record<string, any>; // flexible (store raw response if needed)

//   @Prop({ default: null })
//   paidAt!: Date;

//   @Prop()
//   deliveryMode!: DeliveryMode;

//   @Prop()
//   deliveryAddress?: DeliveryAddress;

//   @Prop()
//   vendorsPaymentBreakdown!: PaymentVendorBreakdown[];

//   @Prop({ default: 0 })
//   collectionFee!: number;

//   @Prop({ default: 0 })
//   deliveryFee!: number;

//   @Prop({ default: false })
//   processed!: boolean;
// }

@Schema({ _id: false })
export class PaymentVendorBreakdown {
  @Prop({ type: Types.ObjectId, required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  productTotal!: number;

  @Prop({ required: true })
  shippingFee!: number;

  @Prop({ required: true })
  total!: number;
}

export const PaymentVendorBreakdownSchema = SchemaFactory.createForClass(
  PaymentVendorBreakdown,
);

@Schema({ _id: false })
export class PaymentPlatformFees {
  @Prop({ default: 0 })
  collectionFee!: number;

  @Prop({ default: 0 })
  deliveryFee!: number;
}

export const PaymentPlatformFeesSchema =
  SchemaFactory.createForClass(PaymentPlatformFees);

@Schema({ _id: false })
export class PaymentBreakdown {
  @Prop({ type: [PaymentVendorBreakdownSchema], default: [] })
  vendors!: PaymentVendorBreakdown[];

  @Prop({ type: PaymentPlatformFeesSchema, required: true })
  platformFees!: PaymentPlatformFees;

  @Prop({ enum: DeliveryMode, required: true })
  deliveryMode!: DeliveryMode;

  @Prop({ type: Object, default: null })
  deliveryAddress?: DeliveryAddress | null;

  @Prop({ type: Types.ObjectId, default: null })
  pickupCenter?: Types.ObjectId | null;
}

export const PaymentBreakdownSchema =
  SchemaFactory.createForClass(PaymentBreakdown);

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  isExpired!: boolean;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, unique: true })
  reference!: string;

  @Prop()
  providerReference!: string;

  @Prop()
  authorizationUrl!: string;

  @Prop({
    type: String,
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider!: PaymentProvider;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.pending })
  status!: PaymentStatus;

  @Prop({ default: false })
  verified!: boolean;

  @Prop({ type: Object })
  metadata!: Record<string, any>;

  @Prop({ default: null })
  paidAt!: Date;

  @Prop({ type: PaymentBreakdownSchema, required: true })
  paymentBreakdown!: PaymentBreakdown;

  @Prop({ default: false })
  processed!: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({
  userId: 1,
  orderId: 1,
  status: 1,
  expiresAt: 1,
});

PaymentSchema.index({ providerReference: 1 });
