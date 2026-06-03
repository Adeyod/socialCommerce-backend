import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, unique: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Business' })
  businessId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity!: number;

  @Prop({ required: true, default: 0 })
  reservedQuantity!: number;

  @Prop({ default: 5 })
  lowStockThreshold!: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
