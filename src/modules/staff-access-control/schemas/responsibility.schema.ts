import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ResponsibilityDocument = HydratedDocument<Responsibility>;

@Schema({ timestamps: true })
export class Responsibility {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;
}

export const ResponsibilitySchema =
  SchemaFactory.createForClass(Responsibility);
