import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
