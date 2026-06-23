import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum WalletOwnerType {
  user = 'user',
  business = 'business',
  platform = 'platform',
}
export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({
    type: Types.ObjectId,
    ref: 'Business',
    required: false,
    default: undefined,
  })
  businessId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
    default: undefined,
  })
  userId?: Types.ObjectId;

  @Prop({ enum: WalletOwnerType, required: true })
  ownerType!: WalletOwnerType;

  @Prop({ default: 0 })
  withdrawableBalance!: number;

  @Prop({ default: 0 })
  yetToBeClearedBalance!: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet) as any;

WalletSchema.pre('save', function (this: Wallet) {
  const isUser = this.ownerType === WalletOwnerType.user;
  const isBusiness = this.ownerType === WalletOwnerType.business;
  const isPlatform = this.ownerType === WalletOwnerType.platform;

  if (isUser && !this.userId) {
    throw new Error('userId is required for user wallet');
  }

  if (isBusiness && !this.businessId) {
    throw new Error('businessId is required for business wallet');
  }

  if (isPlatform && (this.userId || this.businessId)) {
    throw new Error('Platform wallet cannot have IDs');
  }
});

WalletSchema.index(
  { userId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

WalletSchema.index(
  { businessId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

WalletSchema.index(
  { ownerType: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerType: 'platform' },
  },
);
