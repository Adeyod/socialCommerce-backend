import {
  Body,
  Controller,
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
import { BusinessesService } from './businesses.service';
import { BusinessUpdateDto } from './dtos/business-update.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Patch('add-business-address/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.add_business_address)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Add business address and update business verification status to true.',
    description:
      'This is the endpoint for adding business physical location to the business document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to add business address.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async verifyBusinessByAddingBusinessAddress(
    @Param('businessId') businessId: string,
    @Body() addressData: BusinessUpdateDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.businessesService.verifyBusinessByAddingBusinessAddress(
        businessId,
        addressData,
      );

    return response;
  }
}
