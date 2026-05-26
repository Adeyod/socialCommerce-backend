import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnalyticsDocument = HydratedDocument<Analytics>;

@Schema({ timestamps: true })
export class Analytics {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ default: 0 })
  totalRevenue!: number;

  @Prop({ default: 0 })
  totalOrders!: number;

  @Prop({ default: 0 })
  totalProductsSold!: number;

  @Prop({ default: 0 })
  totalCustomers!: number;

  @Prop()
  lastUpdated!: Date;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
