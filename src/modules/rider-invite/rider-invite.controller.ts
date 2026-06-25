import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { AcceptRiderInviteDto } from './dtos/accept-invite.dto';
import { CreateRiderInviteDto } from './dtos/create-invite.dto';
import { RiderInviteService } from './rider-invite.service';

@Controller('rider-invites')
export class RiderInviteController {
  constructor(private readonly riderInviteService: RiderInviteService) {}

  // Pickup center invites rider
  @Post('create-invite')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.invite_rider)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Invite created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite user to be rider',
    description:
      'This is the endpoint that pickup center is going to use to invite user to be rider.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invite created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create invite.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createRiderInvite(
    @Body() dto: CreateRiderInviteDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.riderInviteService.createRiderInvite(dto, user);
    return response;
  }

  // Rider accepts invite
  @Post('accept-invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Invite accepted successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User accepts to be rider',
    description:
      'This is the endpoint that user will use to accept to be a rider.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invite accepted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to accept invite.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async acceptInvite(
    @Body() dto: AcceptRiderInviteDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.riderInviteService.acceptInvite(
      dto.token,
      user,
    );
    return response;
  }
}
