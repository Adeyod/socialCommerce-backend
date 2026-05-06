import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RiderDataDto } from '../dtos/rider-data.dto';
import { VendorDataDto } from '../dtos/vendor-data.dto';
import {
  PromoterProfile,
  PromoterProfileDocument,
} from '../schemas/promoter-profile.schema';
import {
  RiderProfile,
  RiderProfileDocument,
} from '../schemas/rider-profile.schema';
import {
  VendorProfile,
  VendorProfileDocument,
} from '../schemas/vendor-profile.schema';

@Injectable()
export class PartnersRepository {
  constructor(
    @InjectModel(VendorProfile.name)
    private vendorModel: Model<VendorProfileDocument>,
    @InjectModel(RiderProfile.name)
    private riderModel: Model<RiderProfileDocument>,
    @InjectModel(PromoterProfile.name)
    private promoterModel: Model<PromoterProfileDocument>,
  ) {}

  async createRiderProfile(
    userId: Types.ObjectId,
    riderDataDto: RiderDataDto,
    businessId: Types.ObjectId,
  ) {
    const details = await new this.riderModel({
      businessId,
      userId,
      vehicleType: riderDataDto.vehicleType,
      licenseNumber: riderDataDto.licenseNumber,
    }).save();

    return details;
  }
  async createVendorProfile(
    userId: Types.ObjectId,
    vendorDataDto: VendorDataDto,
    businessId: Types.ObjectId,
  ) {
    const details = await new this.vendorModel({
      businessId,
      userId,
      storeName: vendorDataDto.storeName,
      description: vendorDataDto.description,
    }).save();

    return details;
  }
  async createPromoterProfile(
    userId: Types.ObjectId,
    referralCode: string,
    businessId: Types.ObjectId,
  ) {
    // Generate referral code for promoter here before creating the promoter.
    const details = await new this.promoterModel({
      businessId,
      userId,
      referralCode,
    }).save();

    return details;
  }
}
