import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';
import {
  StaffPermission,
  StaffPermissionDocument,
} from './schemas/staff-permission.schema';

@Injectable()
export class StaffPermissionService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(StaffPermission.name)
    private staffPermissionModel: Model<StaffPermissionDocument>,
  ) {}

  async getStaffPermissions(userId: string, businessId: string) {
    const userObj = new Types.ObjectId(userId);
    const businessObj = new Types.ObjectId(businessId);

    const staff = await this.staffModel.findOne({
      userId: userObj,
      businessId: businessObj,
      isActive: true,
    });

    if (!staff) return null;

    const role = await this.roleModel.findById(staff.roleId);

    if (!role) return null;

    const rolePermissions = role.permissions || [];

    const staffPermissions = await this.staffPermissionModel.find({
      staffId: staff._id,
      businessId: businessObj,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    const overridePermissions = staffPermissions.flatMap(
      (p) => p.permissions || [],
    );

    const finalPermissions = Array.from(
      new Set([...rolePermissions, ...overridePermissions]),
    );

    return {
      staff,
      role,
      permissions: finalPermissions,
    };
  }
}
