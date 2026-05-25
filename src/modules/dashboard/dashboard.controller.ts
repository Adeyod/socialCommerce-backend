import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('buyer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Buyer dashboard fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get buyer dashboard.',
    description: 'This is the endpoint to get buyer dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer dashboard fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch Buyer dashboard.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBuyerDashboard(@GetCurrentUser() user: JwtUser) {
    const response = await this.dashboardService.getBuyerDashboard(user);

    console.log('response:', response);

    return response;
  }
  @Get('vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Vendor dashboard fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get vendor dashboard.',
    description: 'This is the endpoint to get vendor dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor dashboard fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch vendor dashboard.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorDashboard(@GetCurrentUser() user: JwtUser) {
    const response = await this.dashboardService.getVendorDashboard(user);

    console.log('response:', response);

    return response;
  }
}
