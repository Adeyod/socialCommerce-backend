import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Role } from '../users/schemas/user.schema';
import { BusinessShippingRateService } from './business-shipping-rate.service';
import { CreateBusinessShippingRateDto } from './dtos/business-shipping-rate.dto';

@Controller('business-shipping-rate')
export class BusinessShippingRateController {
  constructor(
    private readonly businessShippingRateService: BusinessShippingRateService,
  ) {}

  @Post('create-business-shipping-rate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_business_shipping_rate)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business shipping rate created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create business shipping rates.',
    description:
      'This is the endpoint that each business is going to use to create shipping rate per state for his business.',
  })
  @ApiResponse({
    status: 201,
    description: 'Business shipping rate created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create business shipping rate.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createBusinessShippingRate(
    @GetCurrentUser() user: JwtUser,
    @Body() dto: CreateBusinessShippingRateDto,
  ) {
    const response =
      await this.businessShippingRateService.createBusinessShippingRate(
        user,
        dto,
      );
  }

  @Get(
    'get-business-shipping-rate-per-destination-state/:businessId/:destinationState',
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @Permissions(Permission.view_business_shipping_rate)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business shipping rate fetched successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Get business shipping rate.',
    description:
      'This is the endpoint for getting the shipping rate that a business is charging for a state with weight range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business Shipping rate fetched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch business shipping rate.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBusinessShippingPricePerState(
    @Param('businessId') businessId: string,
    @Param('destinationState') destinationState: string,
    @Body() weight: number,
  ) {
    const response =
      await this.businessShippingRateService.getBusinessShippingPricePerState(
        businessId,
        destinationState,
        weight,
      );

    return response;
  }
  @Get('get-business-shipping-rate-all-states/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @Permissions(Permission.view_business_shipping_rate)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business shipping rate fetched successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Get business shipping rate.',
    description:
      'This is the endpoint for getting the shipping rate that a business is charging for a state with weight range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business Shipping rates fetched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch business shipping rates.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBusinessShippingPrice(@Param('businessId') businessId: string) {
    const response =
      await this.businessShippingRateService.getBusinessShippingPrice(
        businessId,
      );

    return response;
  }
}
