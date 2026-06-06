import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { Role } from '../users/schemas/user.schema';
import { PickupCenterCreationDto } from './dtos/pickup-center.dto';
import { UpdatePickupCenterDto } from './dtos/update-pickup-center.dto';
import { PickupCenterService } from './pickup-center.service';

@Controller('pickup-center')
export class PickupCenterController {
  constructor(private readonly pickupCenterService: PickupCenterService) {}

  @Post('create-center')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pick up center creation',
    description: 'This is the endpoint for creating a new pick up center.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pick up center created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createPickupCenter(@Body() dto: PickupCenterCreationDto) {
    const response = await this.pickupCenterService.createPickupCenter(dto);

    return response;
  }

  @Get('get-all-pickup-states')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center states fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pick up center states fetching',
    description:
      'This is the endpoint for fetching all states with atleast one pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center states fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch states with pick up centers.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getStatesThatHasPickupCenters() {
    const centers =
      await this.pickupCenterService.getStatesThatHasPickupCenters();

    return centers;
  }

  @Get('get-all-pickup-centers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pick up center fetching',
    description: 'This is the endpoint for fetching all pick up centers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up centers.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPickupCenters() {
    const centers = await this.pickupCenterService.getAllPickupCenters();

    return centers;
  }

  @Get('get-a-pickup-center/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pick up center fetching',
    description: 'This is the endpoint for fetching a pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPickupCenterById(@Param('pickupCenterId') pickupCenterId: string) {
    const centers =
      await this.pickupCenterService.getPickupCenterById(pickupCenterId);

    return centers;
  }

  @Get('get-state-main-pickup-center/:state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pick up center fetching',
    description: 'This is the endpoint for fetching a pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getStateMainPickupCenterByState(@Param('state') state: NigeriaState) {
    const centers =
      await this.pickupCenterService.getStateMainPickupCenterByState(state);

    return centers;
  }

  @Get('get-state-pickup-centers/:state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pick up center fetching',
    description: 'This is the endpoint for fetching a pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPickupCenterByState(@Param('state') state: NigeriaState) {
    const centers =
      await this.pickupCenterService.getPickupCenterByState(state);

    return centers;
  }

  @Patch('update-pickup-center-to-state-main/:pickupCenterId/:state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Pick up center to state main pickup center',
    description:
      'This is the endpoint for updating a pick up center to state main pickup center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to update pick up center to state main pickup center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updatePickupCenterToStateMainPickupCenter(
    @Param('pickupCenterId') pickupCenterId: string,
    @Param('state') state: NigeriaState,
  ) {
    const center =
      await this.pickupCenterService.updatePickupCenterToStateMainPickupCenter(
        pickupCenterId,
        state,
      );

    return center;
  }
  @Patch('update-pickup-center/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Pick up center',
    description: 'This is the endpoint for updating a pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to update pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async updatePickupCenterById(
    @Param('pickupCenterId') pickupCenterId: string,
    @Body() dto: UpdatePickupCenterDto,
  ) {
    const centers = await this.pickupCenterService.updatePickupCenterById(
      pickupCenterId,
      dto,
    );

    return centers;
  }

  @Patch('delete-pickup-center/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Pick up center',
    description: 'This is the endpoint for deleting a pick up center.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to delete pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async deactivatePickupCenterById(
    @Param('pickupCenterId') pickupCenterId: string,
  ) {
    const centers =
      await this.pickupCenterService.deactivatePickupCenterById(pickupCenterId);

    return centers;
  }

  @Get('get-closest-pickup-centers/:state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Pick up centers',
    description:
      'This is the endpoint for fetching pick up centers closer to the buyer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async findClosestPickupCenters(@Param('state') state: NigeriaState) {
    const centers =
      await this.pickupCenterService.findClosestPickupCenters(state);

    return centers;
  }
}
