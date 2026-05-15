import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { Permission } from '../../../common/enums/permissions.enum';
import type { JwtUser } from '../../../common/types/jwt-user.type';
import { validateBusinessOwnership } from '../../../common/utils/helper';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RoleRepository } from './repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async createRole(
    businessId: string,
    user: JwtUser,
    createRoleDto: CreateRoleDto,
    staffContext: any,
  ) {
    const id = new Types.ObjectId(businessId);
    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!businessExist) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    if (!staffContext.permissions.includes(Permission.create_role)) {
      throw new ForbiddenException({
        message: 'You are not authorized to perform this task.',
        success: false,
        status: 403,
      });
    }

    const creator = user.sub.toString();

    const role = await this.roleRepository.createRole(
      id,
      createRoleDto,
      creator,
    );

    if (!role) {
      throw new BadRequestException({
        message: 'Unable to create role.',
        success: false,
        status: 400,
      });
    }

    const validateBiz = validateBusinessOwnership(
      role.businessId.toString(),
      businessId,
    );

    return role;
  }
  async findRoleById(roleId: string, user: JwtUser, staffContext: any) {
    const role = await this.roleRepository.findRoleById(roleId);

    if (!role) {
      throw new NotFoundException({
        message: 'Role not found.',
        success: false,
        status: 404,
      });
    }

    return role;
  }
  async findRolesByBusinessId(
    businessId: string,
    user: JwtUser,
    queryWithPaginationDto: QueryWithPaginationDto,
    staffContext: any,
  ) {
    const roles = await this.roleRepository.findRolesByBusinessId(
      businessId,
      queryWithPaginationDto,
    );

    if (!roles.rolesObj || roles.rolesObj.length === 0) {
      throw new NotFoundException({
        message: 'Roles not found.',
        success: false,
        status: 404,
      });
    }

    return roles;
  }
  async updateRoleById(
    roleId: string,
    user: JwtUser,
    businessId: string,
    updateRoleDto: UpdateRoleDto,
    staffContext: any,
  ) {
    const role = await this.roleRepository.findRoleById(roleId);

    if (!role) {
      throw new NotFoundException({
        message: 'Role not found.',
        success: false,
        status: 404,
      });
    }

    if (role.businessId.toString() !== businessId) {
      throw new ForbiddenException({
        message: 'You can only update the role that belong to your business.',
        success: false,
        status: 403,
      });
    }

    const response = await this.roleRepository.updateRoleById(
      roleId,
      updateRoleDto,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to update role.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
