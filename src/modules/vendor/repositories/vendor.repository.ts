import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VendorDataDto } from '../dtos/vendor-data.dto';
import { VendorProfile, VendorProfileDocument } from '../schemas/vendor.schema';

@Injectable()
export class VendorProfileRepository {
  constructor(
    @InjectModel(VendorProfile.name)
    private vendorModel: Model<VendorProfileDocument>,
  ) {}

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

  async getVendorProfileByUserId(
    userId: string,
  ): Promise<VendorProfileDocument | null> {
    const id = new Types.ObjectId(userId);
    const vendor = await this.vendorModel.findOne({
      userId: id,
    });
    return vendor;
  }
}
