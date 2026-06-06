import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum NigeriaState {
  ABIA = 'Abia',
  ABUJA = 'Abuja',
  ADAMAWA = 'Adamawa',
  AKWA_IBOM = 'Akwa Ibom',
  ANAMBRA = 'Anambra',
  BAUCHI = 'Bauchi',
  BAYELSA = 'Bayelsa',
  BENUE = 'Benue',
  BORNO = 'Borno',
  CROSS_RIVER = 'Cross River',
  DELTA = 'Delta',
  EBONYI = 'Ebonyi',
  EDO = 'Edo',
  EKITI = 'Ekiti',
  ENUGU = 'Enugu',
  FCT = 'FCT',
  GOMBE = 'Gombe',
  IMO = 'Imo',
  JIGAWA = 'Jigawa',
  KADUNA = 'Kaduna',
  KANO = 'Kano',
  KATSINA = 'Katsina',
  KEBBI = 'Kebbi',
  KOGI = 'Kogi',
  KWARA = 'Kwara',
  LAGOS = 'Lagos',
  NASARAWA = 'Nasarawa',
  NIGER = 'Niger',
  OGUN = 'Ogun',
  ONDO = 'Ondo',
  OSUN = 'Osun',
  OYO = 'Oyo',
  PLATEAU = 'Plateau',
  RIVERS = 'Rivers',
  SOKOTO = 'Sokoto',
  TARABA = 'Taraba',
  YOBE = 'Yobe',
  ZAMFARA = 'Zamfara',
}

export type CollectionFeeDocument = HydratedDocument<CollectionFee>;

@Schema({ timestamps: true })
export class CollectionFee {
  @Prop({ required: true, unique: true, trim: true, toLowerCase: true })
  state!: NigeriaState;

  @Prop({ required: true })
  baseFee!: number;

  @Prop({ required: true })
  additionalFee!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CollectionFeeSchema = SchemaFactory.createForClass(CollectionFee);
