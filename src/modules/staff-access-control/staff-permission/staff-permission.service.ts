import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission } from '../../../common/enums/permissions.enum';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { Role, RoleDocument } from '../role/schemas/role.schema';
import { Staff, StaffDocument } from '../staff/schemas/staff.schema';
import {
  StaffPermission,
  StaffPermissionDocument,
} from './schemas/staff-permission.schema';

@Injectable()
export class StaffPermissionService {
  constructor(
    private businessesRepository: BusinessesRepository,
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

  async isBusinessOwner(userId: string, businessId: string) {
    if (!Types.ObjectId.isValid(businessId)) {
      return false;
    }
    const businessObj = new Types.ObjectId(businessId);

    const business =
      await this.businessesRepository.findBusinessOwnerByBusinessId(
        businessObj,
      );

    if (!business) {
      return false;
    }

    return business.ownerId.toString() === userId;
  }

  async getUserBusinessAccess(userId: string, businessId: string) {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(businessId)
    ) {
      return {
        isOwner: false,
        permissions: [],
      };
    }

    const userObj = new Types.ObjectId(userId);
    const businessObj = new Types.ObjectId(businessId);

    const business =
      await this.businessesRepository.findBusinessOwnerByBusinessId(
        businessObj,
      );

    if (business && business.ownerId.toString() === userId) {
      return {
        isOwner: true,
        permissions: Object.values(Permission),
      };
    }

    const staff = await this.staffModel.findOne({
      userId: userObj,
      businessId: businessObj,
      isActive: true,
    });

    if (!staff) {
      return {
        isOwner: false,
        permissions: [],
      };
    }

    const [role, staffPermissions] = await Promise.all([
      this.roleModel.findById(staff.roleId),
      this.staffPermissionModel.find({
        staffId: staff._id,
        businessId: businessObj,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }),
    ]);

    if (!role) {
      return {
        isOwner: false,
        permissions: [],
        staff,
      };
    }

    const rolePermissions = role.permissions || [];

    const overridePermissions = staffPermissions.flatMap(
      (p) => p.permissions || [],
    );

    const finalPermissions = Array.from(
      new Set([...rolePermissions, ...overridePermissions]),
    );

    return {
      isOwner: false,
      permissions: finalPermissions,
      staff,
      role,
    };
  }
}
