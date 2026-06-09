import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { StaffPermissionService } from '../staff-permission/staff-permission.service';

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

    console.log('user inside permission:', user);

    if (user === undefined) {
      throw new ForbiddenException({
        message: 'Authentication missing.',
        success: false,
        status: 403,
      });
    }

    if (!user) {
      throw new ForbiddenException({
        message: 'User not authenticated',
        success: false,
        status: 403,
      });
    }

    // PLATFORM ADMIN
    if (user.role === 'admin') {
      return true;
    }

    const userId = user._id || user.sub;

    if (!userId) {
      throw new ForbiddenException({
        message: 'Invalid user payload',
        success: false,
        status: 403,
      });
    }

    // Resolve businessId safely
    const rawBusinessId = request.params.businessId;

    console.log('rawBusinessId:', rawBusinessId);

    if (!rawBusinessId) {
      throw new ForbiddenException({
        message: 'Business ID is required.',
        success: false,
        status: 403,
      });
    }

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

    const access = await this.staffPermissionService.getUserBusinessAccess(
      userId,
      businessId,
    );

    if (access.isOwner) {
      request.staffContext = {
        permissions: access.permissions,
      };

      return true;
    }

    if (!access.permissions.length) {
      throw new ForbiddenException({
        message: 'Not a business staff',
        success: false,
        status: 403,
      });
    }

    request.staffContext = access;

    const permissionSet = new Set(access.permissions);

    const hasAccess = requiredPermissions.every((permission) =>
      permissionSet.has(permission),
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
