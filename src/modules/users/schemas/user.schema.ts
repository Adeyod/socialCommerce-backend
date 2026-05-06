import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Role {
  admin = 'admin',
  user = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.user })
  role!: Role;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  // @Prop({ required: false })
  // referralCode!: string;

  // @Prop({ type: Types.ObjectId, ref: 'User' })
  // referredBy!: Types.ObjectId;

  // @Prop({
  //   type: [
  //     {
  //       _id: false,
  //       userId: { type: Types.ObjectId, ref: 'User', required: true },
  //       level: { type: Number, required: true },
  //     },
  //   ],
  //   default: [],
  // })
  // referralChain!: {
  //   userId: Types.ObjectId;
  //   level: number;
  // }[];

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isBusinessPartner!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'referralChain.userId': 1 });
