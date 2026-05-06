import { Module } from '@nestjs/common';
import { ResponsibilityController } from './responsibility/responsibility.controller';
import { ResponsibilityService } from './responsibility/responsibility.service';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';

@Module({
  providers: [StaffService, RoleService, ResponsibilityService],
  controllers: [StaffController, RoleController, ResponsibilityController],
})
export class StaffAccessControlModule {}
