import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Permission } from '../../../common/enums/permissions.enum';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { RoleRepository } from '../role/repositories/role.repository';
import { StaffRepository } from '../staff/repositories/staff.repository';
import { StaffPermissionRepository } from './repositories/staff-permission.repository';

@Injectable()
export class StaffPermissionService {
  constructor(
    private businessesRepository: BusinessesRepository,
    private staffRepository: StaffRepository,
    private roleRepository: RoleRepository,
    private staffPermissionRepository: StaffPermissionRepository,
  ) {}

  async getStaffPermissions(userId: string, businessId: string) {
    const staff = await this.staffRepository.findStaff(userId, businessId);

    if (!staff) return null;

    const role = await this.roleRepository.findRoleById(
      staff.roleId.toString(),
    );

    if (!role) return null;

    const rolePermissions = role.permissions || [];

    const staffPermissions =
      await this.staffPermissionRepository.findPermissions(
        staff._id.toString(),
        businessId,
      );

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

    const staff = await this.staffRepository.findStaff(userId, businessId);

    if (!staff) {
      return {
        isOwner: false,
        permissions: [],
      };
    }

    const [role, staffPermissions] = await Promise.all([
      this.roleRepository.findRoleById(staff.roleId.toString()),

      this.staffPermissionRepository.findPermissions(
        staff._id.toString(),
        businessId,
      ),
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
