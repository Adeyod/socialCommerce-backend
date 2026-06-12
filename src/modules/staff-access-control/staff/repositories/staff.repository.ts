import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument } from '../schemas/staff.schema';

@Injectable()
export class StaffRepository {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async findStaff(
    userId: string,
    businessId: string,
  ): Promise<StaffDocument | null> {
    const userObj = new Types.ObjectId(userId);
    const businessObj = new Types.ObjectId(businessId);

    const staff = await this.staffModel.findOne({
      userId: userObj,
      businessId: businessObj,
      isActive: true,
    });

    return staff;
  }
}
