// src/common/constants/permissions.ts

import { Permission } from '../enums/permissions.enum';

export const ROLE_PERMISSIONS = {
  owner: [
    Permission.create_product,
    Permission.delete_product,
    Permission.update_product,
  ],

  admin: [Permission.create_product, Permission.update_product],

  manager: [Permission.create_product, Permission.update_product],

  staff: [Permission.view_product],

  viewer: [],
};
