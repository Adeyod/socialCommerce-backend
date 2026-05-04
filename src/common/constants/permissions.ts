// src/common/constants/permissions.ts

import { Permission } from '../enums/permissions.enum';

export const ROLE_PERMISSIONS = {
  owner: [
    Permission.listing_create,
    Permission.listing_update,
    Permission.listing_delete,
    Permission.booking_view,
    Permission.booking_cancel,
    Permission.member_manage,
  ],

  admin: [
    Permission.listing_create,
    Permission.listing_update,
    Permission.booking_view,
    Permission.booking_cancel,
  ],

  manager: [Permission.listing_update, Permission.booking_view],

  staff: [Permission.booking_view],

  viewer: [],
};
