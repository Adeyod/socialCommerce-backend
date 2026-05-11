import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { StaffPermissionService } from '../services/staff-permission.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private staffPermissionService: StaffPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        message: 'User not authenticated',
        success: false,
        status: 403,
      });
    }

    // 👑 PLATFORM ADMIN
    if (user.role === 'admin') {
      return true;
    }

    // 🔍 Resolve businessId safely
    const rawBusinessId = request.headers['x-business-id'];

    const businessId =
      (Array.isArray(rawBusinessId) ? rawBusinessId[0] : rawBusinessId) ||
      user.businessId;

    if (!businessId) {
      throw new ForbiddenException({
        message: 'Business context required',
        success: false,
        status: 403,
      });
    }

    // 👑 BUSINESS OWNER (bypass staff system)
    if (user.businessId?.toString() === businessId.toString()) {
      return true;
    }

    // 🔥 STAFF PERMISSION CHECK
    const staffContext = await this.staffPermissionService.getStaffPermissions(
      user._id.toString(),
      businessId.toString(),
    );

    if (!staffContext) {
      throw new ForbiddenException({
        message: 'Not a business staff',
        success: false,
        status: 403,
      });
    }

    request.staffContext = staffContext;

    const hasAccess = requiredPermissions.every((permission) =>
      staffContext.permissions.includes(permission),
    );

    if (!hasAccess) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        success: false,
        status: 403,
      });
    }

    return true;
  }
}
