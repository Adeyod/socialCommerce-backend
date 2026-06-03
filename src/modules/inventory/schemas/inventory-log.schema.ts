import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum InventoryLogType {
  restock = 'restock',
  sale = 'sale',
  adjustment = 'adjustment',
  release = 'release',
}

export type InventoryLogDocument = HydratedDocument<InventoryLog>;

@Schema({ timestamps: true })
export class InventoryLog {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ enum: InventoryLogType, required: true })
  type!: InventoryLogType;

  @Prop({ required: true })
  quantity!: number;

  @Prop()
  previousQuantity!: number;

  @Prop()
  newQuantity!: number;

  @Prop()
  reference?: string;
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);
