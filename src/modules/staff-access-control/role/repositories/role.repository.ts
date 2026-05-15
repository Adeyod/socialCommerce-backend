import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../../common/dto/query-with-pagination';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
  ) {}

  async createRole(
    businessId: Types.ObjectId,
    createRoleDto: CreateRoleDto,
    creator: string,
  ): Promise<RoleDocument | null> {
    const createdBy = new Types.ObjectId(creator);

    const payload = {
      businessId,
      ...createRoleDto,
      createdBy,
    };
    const response = await new this.roleModel(payload).save();
    return response;
  }

  async findRoleById(roleId: string): Promise<RoleDocument | null> {
    const id = new Types.ObjectId(roleId);

    const response = await this.roleModel.findById(id);

    return response;
  }

  async findRolesByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    rolesObj: RoleDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(businessId);

    let query = this.roleModel.find({ businessId: id });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ description: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const response = await query.sort({
      createdAt: -1,
    });

    return {
      rolesObj: response,
      totalCount: count,
      totalPages: pages,
    };
  }

  async updateRoleById(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDocument | null> {
    const id = new Types.ObjectId(roleId);

    const response = await this.roleModel.findByIdAndUpdate(id, updateRoleDto);

    return response;
  }
}
