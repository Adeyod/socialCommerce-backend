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
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { Role } from '../users/schemas/user.schema';
import { CreateHomeDeliveryFeeDto } from './dtos/create-home-delivery.dto';
import { HomeDeliveryService } from './home-delivery.service';

@Controller('home-delivery')
export class HomeDeliveryController {
  constructor(private readonly homeDeliveryService: HomeDeliveryService) {}

  @Post('create-home-delivery-fee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Home delivery fee created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create home delivery fee.',
    description:
      'This is the endpoint for creating home delivery fee for those that want their products to be delivered to their doorstep.',
  })
  @ApiResponse({
    status: 201,
    description: 'Home delivery fee created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create home delivery fee.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createHomeDeliveryFee(@Body() dto: CreateHomeDeliveryFeeDto) {
    const response = await this.homeDeliveryService.createHomeDeliveryFee(dto);

    return response;
  }
  @Get('calculate-home-delivery-fee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Home delivery fee calculated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate home delivery fee.',
    description:
      'This is the endpoint for calculating home delivery fee for a particular nearest bus stop in a state.',
  })
  @ApiResponse({
    status: 201,
    description: 'Home delivery fee calculated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to calculate home delivery fee.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async calculateHomeDeliveryFee(
    @Query('pickupCenterId') pickupCenterId: string,
    @Query('buyerState') buyerState: NigeriaState,
    @Query('nearestBusStop') nearestBusStop: string,
    @Query('weight') weight: number,
  ) {
    const response =
      await this.homeDeliveryService.findHomeDeliveryFeeUsingPickupIdStateWeightAndNearestBusStop(
        pickupCenterId,
        buyerState,
        nearestBusStop,
        weight,
      );

    return response;
  }
  @Get('get-all-home-delivery-fees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Home delivery fees fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all home delivery fees.',
    description:
      'This is the endpoint for fetching all home delivery fees on the platform.',
  })
  @ApiResponse({
    status: 201,
    description: 'Home delivery fees fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch home delivery fees.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllHomeDeliveryFees(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.homeDeliveryService.getAllHomeDeliveryFees(
      queryWithPaginationDto,
    );

    return response;
  }

  @Get('get-home-delivery-rates-to-buyer-bus-stop/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Home delivery fees fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all home delivery fees.',
    description:
      'This is the endpoint for fetching all home delivery fees on the platform.',
  })
  @ApiResponse({
    status: 201,
    description: 'Home delivery fees fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch home delivery fees.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getHomeDeliveryFeesToBuyerNearestBusStop(
    @Param('pickupCenterId') pickupCenterId: string,
    @Query('buyerTown') buyerTown: string,
    @Query('nearestBusStop') nearestBusStop: string,
  ) {
    const response =
      await this.homeDeliveryService.getHomeDeliveryFeesToBuyerNearestBusStop(
        pickupCenterId,
        buyerTown,
        nearestBusStop,
      );

    return response;
  }
  @Get('get-state-delivery-rates-to-nearest-bus-stops/:state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Home delivery fees fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all state home delivery fees.',
    description:
      'This is the endpoint for fetching all home delivery fees for all nearest bus stops in a state.',
  })
  @ApiResponse({
    status: 201,
    description: 'Home delivery fees fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch home delivery fees.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getllAllDeliveryFeesForAStateByState(
    @Param('state') state: NigeriaState,
  ) {
    const response =
      await this.homeDeliveryService.getllAllDeliveryFeesForAStateByState(
        state,
      );

    return response;
  }
}
