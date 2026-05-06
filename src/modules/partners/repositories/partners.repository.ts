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
    userId: string,
    riderDataDto: RiderDataDto,
    businessId: Types.ObjectId,
  ) {
    const id = new Types.ObjectId(userId);

    const details = await new this.riderModel({
      businessId,
      userId: id,
      vehicleType: riderDataDto.vehicleType,
      licenseNumber: riderDataDto.licenseNumber,
    }).save();

    return details;
  }
  async createVendorProfile(
    userId: string,
    vendorDataDto: VendorDataDto,
    businessId: Types.ObjectId,
  ) {
    const id = new Types.ObjectId(userId);
    const details = await new this.vendorModel({
      businessId,
      userId: id,
      storeName: vendorDataDto.storeName,
      description: vendorDataDto.description,
    }).save();

    return details;
  }
  async createPromoterProfile(
    userId: string,
    referralCode: string,
    businessId: Types.ObjectId,
  ) {
    const id = new Types.ObjectId(userId);
    // Generate referral code for promoter here before creating the promoter.
    const details = await new this.promoterModel({
      businessId,
      userId: id,
      referralCode,
    }).save();

    return details;
  }

  async getPromoterProfileByUserId(
    userId: string,
  ): Promise<PromoterProfileDocument | null> {
    const id = new Types.ObjectId(userId);
    const promoter = await this.promoterModel.findOne({
      userId: id,
    });
    return promoter;
  }
  async getVendorProfileByUserId(
    userId: string,
  ): Promise<VendorProfileDocument | null> {
    const id = new Types.ObjectId(userId);
    const vendor = await this.vendorModel.findOne({
      userId: id,
    });
    return vendor;
  }
  async getRiderProfileByUserId(
    userId: string,
  ): Promise<RiderProfileDocument | null> {
    const id = new Types.ObjectId(userId);
    const rider = await this.riderModel.findOne({
      userId: id,
    });

    return rider;
  }
}
