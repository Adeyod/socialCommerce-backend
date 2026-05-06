import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
