import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponsibilityController } from './responsibility/responsibility.controller';
import { ResponsibilityService } from './responsibility/responsibility.service';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import {
  Responsibility,
  ResponsibilitySchema,
} from './schemas/responsibility.schema';
import {
  RoleResponsibility,
  RoleResponsibilitySchema,
} from './schemas/role-responsibility.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import { Staff, StaffSchema } from './schemas/staff.schema';
import { StaffPermissionController } from './services/staff-permission.controller';
import { StaffPermissionService } from './services/staff-permission.service';
import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Role.name, schema: RoleSchema },
      { name: RoleResponsibility.name, schema: RoleResponsibilitySchema },
      { name: Responsibility.name, schema: ResponsibilitySchema },
    ]),
  ],
  providers: [
    StaffPermissionService,
    StaffService,
    RoleService,
    ResponsibilityService,
  ],
  controllers: [
    StaffPermissionController,
    StaffController,
    RoleController,
    ResponsibilityController,
  ],
  exports: [StaffPermissionService],
})
export class StaffAccessControlModule {}
