import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('find-notification-by-businessId/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.get_business_notifications)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business notifications fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find all notifications of a business.',
    description:
      'This is the endpoint for fetching all the notifications of a business.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business notifications fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch business notifications.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findNotificationsByBusinessId(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.notificationsService.findNotificationsByBusinessId(
        businessId,
        user,
      );

    return response;
  }

  @Get('find-notification-by-userId/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('User notifications fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find all notifications of a user.',
    description:
      'This is the endpoint for fetching all the notifications of a user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User notifications fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch user notifications.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findNotificationsByUserId(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.notificationsService.findNotificationsByUserId(
      userId,
      user,
    );

    return response;
  }

  @Patch('mark-business-notification-as-read/:notificationId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.read_business_notifications)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business notification read successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Read business notification.',
    description:
      'This is the endpoint for marking a business notification as being read by the logged in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business notification read successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to read business notification.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async markBusinessNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.notificationsService.markNotificationAsRead(
      notificationId,
      user,
    );

    return response;
  }

  @Patch('mark-user-notification-as-read/:notificationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('User notification read successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Read business notification.',
    description:
      'This is the endpoint for marking a user notification as being read.',
  })
  @ApiResponse({
    status: 200,
    description: 'User notification read successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to read user notification.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async markUserNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.notificationsService.markNotificationAsRead(
      notificationId,
      user,
    );

    return response;
  }
}
