import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleResponsibilityDocument = HydratedDocument<RoleResponsibility>;

@Schema({ timestamps: true })
export class RoleResponsibility {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Responsibility',
    required: true,
  })
  responsibilityId!: Types.ObjectId;
}

export const RoleResponsibilitySchema =
  SchemaFactory.createForClass(RoleResponsibility);
