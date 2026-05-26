import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CallbackError, HydratedDocument, Types } from 'mongoose';

export enum WalletOwnerType {
  user = 'user',
  business = 'business',
  platform = 'platform',
}
export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ enum: WalletOwnerType, required: true })
  ownerType!: WalletOwnerType;

  @Prop({ default: 0 })
  withdrawableBalance!: number;

  @Prop({ default: 0 })
  yetToBeClearedBalance!: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet) as any;

WalletSchema.pre(
  'save',
  function (this: Wallet, next: (err?: CallbackError) => void) {
    const isUser = !!this.userId;
    const isBusiness = !!this.businessId;
    const isPlatform = this.ownerType === WalletOwnerType.platform;

    // PLATFORM must stand alone
    if (isPlatform && (isUser || isBusiness)) {
      return next(
        new Error('Platform wallet cannot have userId or businessId'),
      );
    }

    // USER or BUSINESS must have exactly one ID
    if (!isPlatform && !isUser && !isBusiness) {
      return next(
        new Error('Wallet must belong to user, business, or platform'),
      );
    }

    next();
  },
);

WalletSchema.index({ userId: 1 }, { unique: true, sparse: true });
WalletSchema.index({ businessId: 1 }, { unique: true, sparse: true });
WalletSchema.index(
  { ownerType: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerType: 'platform' },
  },
);
