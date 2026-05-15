import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import type { JwtUser } from '../../../common/types/jwt-user.type';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleRepository } from './repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async createRole(
    businessId: string,
    user: JwtUser,
    createRoleDto: CreateRoleDto,
  ) {}
  async findRoleById(roleId: string, user: JwtUser) {}
  async findRolesByBusinessId(
    businessId: string,
    user: JwtUser,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {}
  async updateRoleById(roleId: string, user: JwtUser, businessId: string) {
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
  }
}
