import { Module } from '@nestjs/common';
import { DeliveryMarketplaceController } from './delivery-marketplace.controller';
import { DeliveryMarketplaceService } from './delivery-marketplace.service';

@Module({
  controllers: [DeliveryMarketplaceController],
  providers: [DeliveryMarketplaceService]
})
export class DeliveryMarketplaceModule {}
