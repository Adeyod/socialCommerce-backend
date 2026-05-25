import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryMarketplaceDocument = HydratedDocument<DeliveryMarketplace>;

export enum MarketplaceStatus {
  open = 'open',
  claimed = 'claimed',
  expired = 'expired',
}

@Schema({ timestamps: true })
export class DeliveryMarketplace {
  @Prop({ type: Types.ObjectId, ref: 'Delivery', required: true })
  deliveryId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: MarketplaceStatus,
    default: MarketplaceStatus.open,
  })
  status!: MarketplaceStatus;

  // riders we notified
  @Prop({ type: [Types.ObjectId], default: [] })
  notifiedRiders!: Types.ObjectId[];

  // riders who opened/viewed
  @Prop({ type: [Types.ObjectId], default: [] })
  viewedRiders!: Types.ObjectId[];

  // riders who attempted claim
  @Prop({ type: [Types.ObjectId], default: [] })
  attemptedRiders!: Types.ObjectId[];

  // winner
  @Prop({ type: Types.ObjectId, ref: 'User' })
  selectedRider?: Types.ObjectId;

  // expiration logic
  @Prop()
  expiresAt?: Date;

  // number of re-broadcasts
  @Prop({ default: 0 })
  broadcastCount!: number;
}

export const DeliveryMarketplaceSchema =
  SchemaFactory.createForClass(DeliveryMarketplace);
