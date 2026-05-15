import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from '../../../../common/enums/permissions.enum';

export type StaffPermissionDocument = HydratedDocument<StaffPermission>;

@Schema({ timestamps: true })
export class StaffPermission {
  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staffId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({
    type: [String],
    enum: Permission,
    required: true,
  })
  permissions!: Permission[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  grantedBy!: Types.ObjectId;

  @Prop()
  isActive!: boolean;

  @Prop()
  revokedAt?: Date;
}

export const StaffPermissionSchema =
  SchemaFactory.createForClass(StaffPermission);
