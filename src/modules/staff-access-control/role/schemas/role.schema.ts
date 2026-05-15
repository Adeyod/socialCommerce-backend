import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from '../../../../common/enums/permissions.enum';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  @Prop()
  permissions!: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);

/**
 * Remove central schemas inside staff-access-control and let each module inside it have its own schema to avoid confusion
 *
 */
