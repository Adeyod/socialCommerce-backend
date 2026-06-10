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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { CampaignService } from './campaign.service';
import { AttachCampaignDto } from './dtos/attach-campaign.dto';
import { CreateCampaignDto } from './dtos/create-campaign.dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('business-create-campaign/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_campaign)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Campaign created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Campaign creation',
    description:
      'This is the endpoint that a business uses to create campaign promotion.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create campaign.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const response = await this.campaignService.createCampaign(businessId, dto);
    return response;
  }

  @Post('attach-campaign-to-product')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_campaign)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Campaign attached to product successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Campaign attach to product',
    description:
      'This is the endpoint that a business uses to attach campaign to product.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign attached to produvt successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to attach campaign to product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async attach(@Body() dto: AttachCampaignDto) {
    const response = await this.campaignService.attachToProduct(
      dto.productId,
      dto.campaignId,
    );

    return response;
  }

  @Get('get-all-campaign-of-a-business/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_campaign)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Campaign attached to product successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Campaign attach to product',
    description:
      'This is the endpoint that a business uses to attach campaign to product.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign attached to produvt successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to attach campaign to product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAll(@Param('businessId') businessId: string) {
    const response =
      await this.campaignService.getBusinessCampaigns(businessId);

    return response;
  }
}
