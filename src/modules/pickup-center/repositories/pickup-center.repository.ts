import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
import { PickupCenterCreationDto } from '../dtos/pickup-center.dto';
import { UpdatePickupCenterDto } from '../dtos/update-pickup-center.dto';
import {
  PickupCenter,
  PickupCenterDocument,
} from '../schemas/pickup-center.schema';

@Injectable()
export class PickupCenterRepository {
  constructor(
    @InjectModel(PickupCenter.name)
    private readonly pickupCenterModel: Model<PickupCenterDocument>,
  ) {}

  async createPickupCenter(
    dto: PickupCenterCreationDto,
  ): Promise<PickupCenterDocument> {
    const center = await new this.pickupCenterModel({
      name: dto.name.trim().toLowerCase(),
      state: dto.state,
      town: dto.town.trim().toLowerCase(),
      address: dto.address.trim().toLowerCase(),
      phone: dto.phone.trim(),
    }).save();

    return center;
  }

  async getAllPickupCenters(): Promise<PickupCenterDocument[]> {
    const centers = await this.pickupCenterModel
      .find({
        isActive: true,
      })
      .exec();

    return centers;
  }

  async getStatesThatHasPickupCenters(): Promise<PickupCenterDocument[]> {
    const response = await this.pickupCenterModel.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          state: '$_id',
          count: 1,
        },
      },
      {
        $sort: { state: 1 },
      },
    ]);

    return response;
  }

  async getPickupCenterById(
    pickupCenterId: string,
  ): Promise<PickupCenterDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);

    const center = await this.pickupCenterModel.findById(id);

    return center;
  }

  async updatePickupCenterToStateMainPickupCenter(
    pickupCenterId: string,
    state: NigeriaState,
  ) {
    const id = new Types.ObjectId(pickupCenterId);

    const response = await this.pickupCenterModel.findOneAndUpdate(
      { _id: id, state: state },
      { isMainHub: true },
      { returnDocument: 'after' },
    );

    return response;
  }

  async getStateMainPickupCenterByState(
    state: NigeriaState,
  ): Promise<PickupCenterDocument | null> {
    const center = await this.pickupCenterModel.findOne({
      state,
      isActive: true,
      isMainHub: true,
    });

    return center;
  }
  async getPickupCentersByState(
    state: NigeriaState,
  ): Promise<PickupCenterDocument[] | null> {
    const center = await this.pickupCenterModel.find({
      state,
      isActive: true,
    });

    return center;
  }
  async getPickupCenterByName(
    dto: PickupCenterCreationDto,
  ): Promise<PickupCenterDocument | null> {
    const center = await this.pickupCenterModel.findOne({
      name: new RegExp(`^${dto.name.trim().toLowerCase()}$`, 'i'),
      state: new RegExp(`^${dto.state.trim().toLowerCase()}$`, 'i'),
      town: new RegExp(`^${dto.town.trim().toLowerCase()}$`, 'i'),
      phone: new RegExp(`^${dto.phone.trim()}$`, 'i'),
      isActive: true,
    });

    return center;
  }

  async updatePickupCenterById(
    pickupCenterId: string,
    updateData: UpdatePickupCenterDto,
  ): Promise<PickupCenterDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);

    const data = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] =
          typeof value === 'string' ? value.trim().toLowerCase() : value;
      }
      return acc;
    }, {} as any);

    const updated = await this.pickupCenterModel.findByIdAndUpdate(
      id,
      { $set: data },
      {
        returnDocument: 'after',
      },
    );

    return updated;
  }

  async deactivatePickupCenterById(
    pickupCenterId: string,
  ): Promise<PickupCenterDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);
    const deleted = await this.pickupCenterModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );

    return deleted;
  }

  async findClosestPickupCenters(
    state: NigeriaState,
  ): Promise<PickupCenterDocument[]> {
    const centers = await this.pickupCenterModel
      .find({
        state,
        isActive: true,
      })
      .limit(5);

    return centers;
  }
}
