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

  async findNearby(
    location: { coordinates: [number, number] },
    radiusInKm: number,
  ) {
    const [lng, lat] = location.coordinates;

    return this.riderModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusInKm * 1000, // meters
        },
      },
      isAvailable: true,
    });
  }

  //   async findNearby(
  //   location: { coordinates: [number, number] },
  //   radiusInKm: number,
  //   requiredArea?: string, // 👈 NEW (e.g. "Ikeja")
  // ) {
  //   const [lng, lat] = location.coordinates;

  //   const riders = await this.riderModel.find({
  //     location: {
  //       $near: {
  //         $geometry: {
  //           type: 'Point',
  //           coordinates: [lng, lat],
  //         },
  //         $maxDistance: radiusInKm * 1000,
  //       },
  //     },
  //     isAvailable: true,
  //   });

  //   // 🔥 filter by serviceAreas
  //   if (!requiredArea) return riders;

  //   return riders.filter((rider) =>
  //     rider.serviceAreas?.some(
  //       (area) =>
  //         area.name?.toLowerCase() === requiredArea.toLowerCase() ||
  //         area.code?.toLowerCase() === requiredArea.toLowerCase(),
  //     ),
  //   );
  // }

  async findByServiceArea(area: string) {
    const normalized = area.toLowerCase();

    const riders = await this.riderModel.find({
      isAvailable: true,
      'serviceAreas.name': { $regex: normalized, $options: 'i' },
    });

    console.log('riders:', riders);

    return riders;
  }

  async findByMultipleAreas(areas: string[]) {
    const normalized = areas.map((a) => a.toLowerCase());
    const riders = await this.riderModel.find({
      isAvailable: true,
      'serviceAreas.code': { $in: normalized },
    });
    return riders;
  }
}
