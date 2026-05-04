import { ROLE_PERMISSIONS } from '../constants/permissions';
import { Permission } from '../enums/permissions.enum';

export function getUserPermissions(member): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[member.role] || [];

  return [
    ...new Set([...rolePermissions, ...(member.permissions as Permission[])]),
  ];
}

export function hasPermission(member, permission: Permission): boolean {
  const permissions = getUserPermissions(member);
  return permissions.includes(permission);
}
