import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PickupCenterCreationDto } from '../dtos/pickup-center.dto';
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
      name: dto.name,
      state: dto.state,
      town: dto.town,
      address: dto.address,
      phone: dto.phone,
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

  async getPickupCenterById(
    pickupCenterId: string,
  ): Promise<PickupCenterDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);

    const center = await this.pickupCenterModel.findById(id);

    return center;
  }

  async getStateMainPickupCenterByState(
    state: string,
  ): Promise<PickupCenterDocument | null> {
    const center = await this.pickupCenterModel.findOne({
      state: new RegExp(`^${state}$`, 'i'),
      isActive: true,
      isMainHub: true,
    });

    return center;
  }
  async getPickupCenterByState(
    state: string,
  ): Promise<PickupCenterDocument | null> {
    const center = await this.pickupCenterModel.findOne({
      state: new RegExp(`^${state}$`, 'i'),
      isActive: true,
    });

    return center;
  }

  async updatePickupCenterById(
    pickupCenterId: string,
    updateData: Partial<PickupCenter>,
  ): Promise<PickupCenterDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);

    const updated = await this.pickupCenterModel.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after' },
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
    state: string,
  ): Promise<PickupCenterDocument[]> {
    const centers = await this.pickupCenterModel
      .find({
        state: new RegExp(`^${state}$`, 'i'),
        isActive: true,
      })
      .limit(5);

    return centers;
  }
}
