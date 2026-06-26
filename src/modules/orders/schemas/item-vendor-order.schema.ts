import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MediaType } from '../../products/enums/product.enum';

export type ItemVendorOrderDocument = HydratedDocument<ItemVendorOrder>;

export enum VendorItemOrderStatus {
  pending = 'pending',
  processing = 'processing',
  sent_to_pickup_center = 'sent_to_pickup_center',
  received_at_pickup_center = 'received_at_pickup_center',
}

@Schema({ timestamps: true })
export class ItemVendorOrder {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'VendorOrder',
    required: true,
    index: true,
  })
  vendorOrderId!: Types.ObjectId;

  @Prop({
    type: [
      {
        type: { type: String, enum: Object.values(MediaType) },
        url: String,
        publicUrl: String,
      },
    ],
    default: [],
  })
  media!: {
    type: MediaType;
    url: string;
    publicUrl: string;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  totalWeight!: number;

  @Prop({
    type: String,
    enum: VendorItemOrderStatus,
    default: VendorItemOrderStatus.pending,
  })
  status!: VendorItemOrderStatus;
}

export const ItemVendorOrderSchema =
  SchemaFactory.createForClass(ItemVendorOrder);

ItemVendorOrderSchema.index({ status: 1 });
ItemVendorOrderSchema.index({ vendorOrderId: 1, status: 1 });
ItemVendorOrderSchema.index({ orderId: 1, status: 1 });
ItemVendorOrderSchema.index({ businessId: 1 });
