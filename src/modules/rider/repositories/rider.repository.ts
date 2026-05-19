import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RiderDataDto } from '../dtos/rider-data.dto';
import { RiderProfile, RiderProfileDocument } from '../schemas/rider.schema';

@Injectable()
export class RiderProfileRepository {
  constructor(
    @InjectModel(RiderProfile.name)
    private riderModel: Model<RiderProfileDocument>,
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
