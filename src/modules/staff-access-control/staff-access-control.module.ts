import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';

import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { Role, RoleSchema } from './role/schemas/role.schema';

import { UsersModule } from '../users/users.module';
import { InvitationController } from './invitation/invitation.controller';
import { InvitationService } from './invitation/invitation.service';
import { InvitationRepository } from './invitation/repositories/invitation.repository';
import {
  Invitation,
  InvitationSchema,
} from './invitation/schemas/invitation.schema';
import { RoleRepository } from './role/repositories/role.repository';
import {
  StaffPermission,
  StaffPermissionSchema,
} from './staff-permission/schemas/staff-permission.schema';
import { StaffPermissionController } from './staff-permission/staff-permission.controller';
import { StaffPermissionService } from './staff-permission/staff-permission.service';
import { Staff, StaffSchema } from './staff/schemas/staff.schema';
import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: StaffPermission.name, schema: StaffPermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Invitation.name, schema: InvitationSchema },
    ]),

    forwardRef(() => UsersModule),
    forwardRef(() => BusinessesModule),
  ],
  providers: [
    StaffPermissionService,
    StaffService,
    RoleService,
    RoleRepository,
    InvitationRepository,
    InvitationService,
  ],
  controllers: [
    StaffPermissionController,
    InvitationController,
    StaffController,
    RoleController,
  ],
  exports: [StaffPermissionService],
})
export class StaffAccessControlModule {}
