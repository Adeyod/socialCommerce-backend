import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StaffPermission,
  StaffPermissionDocument,
} from '../schemas/staff-permission.schema';

@Injectable()
export class StaffPermissionRepository {
  constructor(
    @InjectModel(StaffPermission.name)
    private staffPermissionModel: Model<StaffPermissionDocument>,
  ) {}

  async findPermissions(
    staffId: string,
    businessId: string,
  ): Promise<StaffPermissionDocument[]> {
    const id = new Types.ObjectId(staffId);
    const businessObj = new Types.ObjectId(businessId);

    const permissions = await this.staffPermissionModel
      .find({
        staffId: id,
        businessId: businessObj,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .lean();

    return permissions;
  }
}
