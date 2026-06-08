import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { AttachCampaignDto } from './dtos/attach-campaign.dto';
import { CreateCampaignDto } from './dtos/create-campaign.dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('business-create-campaign/:businessId')
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const response = await this.campaignService.createCampaign(businessId, dto);
    return response;
  }

  @Post('attach-campaign-to-product')
  async attach(@Body() dto: AttachCampaignDto) {
    const response = await this.campaignService.attachToProduct(
      dto.productId,
      dto.campaignId,
    );

    return response;
  }

  @Get()
  async getAll(@Param('businessId') businessId: string) {
    const response =
      await this.campaignService.getBusinessCampaigns(businessId);

    return response;
  }
}
