import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Responsibility,
  ResponsibilityDocument,
} from '../schemas/responsibility.schema';
import {
  RoleResponsibility,
  RoleResponsibilityDocument,
} from '../schemas/role-responsibility.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { Staff, StaffDocument } from '../schemas/staff.schema';

@Injectable()
export class StaffPermissionService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(RoleResponsibility.name)
    private roleResponsibilityModel: Model<RoleResponsibilityDocument>,
    @InjectModel(Responsibility.name)
    private responsibilityModel: Model<ResponsibilityDocument>,
  ) {}

  async getStaffPermissions(userId: string, businessId: string) {
    const staff = await this.staffModel.findOne({
      userId,
      businessId,
      isActive: true,
    });

    if (!staff) return null;

    const role = await this.roleModel.findById(staff.roleId);

    if (!role) return null;

    const roleResponsibilities = await this.roleResponsibilityModel.find({
      roleId: role._id,
    });

    const responsibilityIds = roleResponsibilities.map(
      (r) => r.responsibilityId,
    );

    const responsibilities = await this.responsibilityModel.find({
      _id: { $in: responsibilityIds },
    });

    return {
      staff,
      role,
      permissions: responsibilities.map((r) => r.name),
    };
  }
}
