import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { VendorDataDto } from './dtos/vendor-data.dto';
import { VendorProfileRepository } from './repositories/vendor.repository';

@Injectable()
export class VendorService {
  constructor(private readonly vendorRepository: VendorProfileRepository) {}

  async createVendorProfile(
    userId: string,
    vendorDataDto: VendorDataDto,
    businessId: Types.ObjectId,
  ) {
    const details = await this.vendorRepository.createVendorProfile(
      userId,
      vendorDataDto,
      businessId,
    );

    if (!details) {
      throw new BadRequestException({
        message: 'Unable to create vendor profile.',
        success: false,
        status: 400,
      });
    }

    return details;
  }

  async findVendorProfileByUserId(userId: string) {
    const id = new Types.ObjectId(userId);
    const vendor = await this.vendorRepository.getVendorProfileByUserId(userId);

    return vendor;
  }
  async getVendorProfileByUserId(userId: string) {
    const id = new Types.ObjectId(userId);
    const vendor = await this.vendorRepository.getVendorProfileByUserId(userId);

    if (!vendor) {
      throw new NotFoundException({
        message: 'Vendor not found.',
        success: false,
        status: 404,
      });
    }
    return vendor;
  }
}
