import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../enums/permissions.enum';
import { hasPermission } from '../utils/permissions.utils';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const member = request.businessMember;

    if (!member) {
      throw new ForbiddenException({
        message: 'Not a business member',
        success: false,
        status: 403,
      });
    }

    const hasAccess = requiredPermissions.every((perm) =>
      hasPermission(member, perm),
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
