import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LedgerDocument = HydratedDocument<Ledger>;

export enum LedgerType {
  credit = 'credit',
  debit = 'debit',
}

@Schema({ timestamps: true })
export class Ledger {
  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ enum: LedgerType, required: true })
  type!: LedgerType;

  @Prop({ required: true })
  amount!: number;

  @Prop()
  source!: string; // order, refund, withdrawal

  @Prop()
  referenceId!: string;

  @Prop()
  description!: string;
}

export const LedgerSchema = SchemaFactory.createForClass(Ledger);
