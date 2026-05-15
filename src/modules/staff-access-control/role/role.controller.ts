import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../../common/decorators/get-current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { Permission } from '../../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { JwtUser } from '../../../common/types/jwt-user.type';
import { Role } from '../../users/schemas/user.schema';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('create-role/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_role)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Role created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create role for the business.',
    description:
      'This is the endpoint for business to create role and assign responsibilities to the created role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create role',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async createRole(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: JwtUser,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    const response = await this.roleService.createRole(
      businessId,
      user,
      createRoleDto,
    );

    return response;
  }

  @Get('find-role/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user, Role.admin)
  @Permissions(Permission.view_role)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Role fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetched role successfully.',
    description:
      'This is the endpoint for fetching role that belong to a particular business.',
  })
  @ApiResponse({
    status: 201,
    description: 'Role fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch role',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async findRoleById(
    @Param('roleId') roleId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.roleService.findRoleById(roleId, user);

    return response;
  }

  @Get('find-roles-by-business-id/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user, Role.admin)
  @Permissions(Permission.view_role)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Roles fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetched roles successfully.',
    description:
      'This is the endpoint for fetching roles that belong to a particular business.',
  })
  @ApiResponse({
    status: 201,
    description: 'Roles fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch role',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async findRolesByBusinessId(
    @Param('businessId') businessId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.roleService.findRolesByBusinessId(
      businessId,
      user,
      queryWithPaginationDto,
    );

    return response;
  }

  @Get('update-role/:businessId/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.update_role)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Role updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Updated roles successfully.',
    description:
      'This is the endpoint for updating role that belong to a particular business.',
  })
  @ApiResponse({
    status: 201,
    description: 'Role updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update role',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async updateRoleById(
    @Param('businessId') businessId: string,
    @Param('roleId') roleId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.roleService.updateRoleById(
      roleId,
      user,
      businessId,
    );

    return response;
  }
}
