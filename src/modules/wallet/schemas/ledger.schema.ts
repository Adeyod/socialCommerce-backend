import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type LedgerDocument = HydratedDocument<Ledger>;

export enum LedgerType {
  credit = 'credit',
  debit = 'debit',
}

export enum LedgerStatus {
  pending = 'pending',
  cleared = 'cleared',
}

export enum LedgerOwnerType {
  user = 'user',
  business = 'business',
  platform = 'platform',
}

export enum LedgerCategory {
  order_payment = 'order_payment',
  referral_bonus = 'referral_bonus',
  withdrawal = 'withdrawal',
  refund = 'refund',
  platform_fee = 'platform_fee',
}

@Schema({ timestamps: true })
export class Ledger {
  @Prop({ enum: LedgerOwnerType, required: true })
  ownerType!: LedgerOwnerType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId?: Types.ObjectId;

  @Prop({ enum: LedgerType, required: true })
  type!: LedgerType;

  @Prop({ required: true })
  amount!: number;

  @Prop({ enum: LedgerCategory, required: true })
  category!: LedgerCategory;

  @Prop({ enum: LedgerStatus, default: LedgerStatus.pending })
  status!: LedgerStatus;

  @Prop()
  releaseAt?: Date;

  @Prop()
  referenceId!: string;

  @Prop()
  description!: string;

  // referral tracking (optional but powerful)
  @Prop({ type: Types.ObjectId })
  relatedUserId?: Types.ObjectId; // who triggered this (buyer)

  @Prop()
  referralLevel?: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;
}

export const LedgerSchema = SchemaFactory.createForClass(Ledger) as any;

// LedgerSchema.pre('save', function (this: Ledger) {
//   if (!this.userId && !this.businessId) {
//     throw new Error('Ledger must belong to a user or business');
//   }

//   if (this.userId && this.businessId) {
//     throw new Error('Ledger cannot belong to both');
//   }
// });

LedgerSchema.pre('save', function (this: Ledger) {
  // PLATFORM case (no userId or businessId required)
  if (this.ownerType === LedgerOwnerType.platform) {
    if (this.userId || this.businessId) {
      throw new Error('Platform ledger cannot have userId or businessId');
    }
    return;
  }

  // USER case
  if (this.ownerType === LedgerOwnerType.user) {
    if (!this.userId) {
      throw new Error('User ledger must have userId');
    }
    if (this.businessId) {
      throw new Error('User ledger cannot have businessId');
    }
    return;
  }

  // BUSINESS case
  if (this.ownerType === LedgerOwnerType.business) {
    if (!this.businessId) {
      throw new Error('Business ledger must have businessId');
    }
    if (this.userId) {
      throw new Error('Business ledger cannot have userId');
    }
    return;
  }
});
