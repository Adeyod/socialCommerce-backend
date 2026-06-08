import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';
import { ProductsModule } from '../products/products.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignRepository } from './repositories/campaign.repository';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import {
  ProductCampaign,
  ProductCampaignSchema,
} from './schemas/product-campaign-mapping.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: ProductCampaign.name, schema: ProductCampaignSchema },
    ]),
    BusinessesModule,
    ProductsModule,
  ],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignRepository],
  exports: [CampaignService, CampaignRepository],
})
export class CampaignModule {}
