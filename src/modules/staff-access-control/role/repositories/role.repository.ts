import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleDocument | null> {
    const response = await new this.roleModel(createRoleDto).save();
    return response;
  }

  async findRoleById(roleId: string): Promise<RoleDocument | null> {
    const id = new Types.ObjectId(roleId);

    const response = await this.roleModel.findById(id);

    return response;
  }

  async findRolesByBusinessId(
    businessId: string,
  ): Promise<RoleDocument[] | null> {
    const id = new Types.ObjectId(businessId);

    const response = await this.roleModel.find({
      businessId: id,
    });

    return response;
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
