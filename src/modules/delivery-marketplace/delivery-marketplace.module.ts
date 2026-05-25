import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryMarketplaceController } from './delivery-marketplace.controller';
import { DeliveryMarketplaceService } from './delivery-marketplace.service';
import { DeliveryMarketplaceRepository } from './repositories/delivery-marketplace.repository';
import {
  DeliveryMarketplace,
  DeliveryMarketplaceSchema,
} from './schemas/delivery-marketplace.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryMarketplace.name, schema: DeliveryMarketplaceSchema },
    ]),
    DeliveryModule,
  ],
  controllers: [DeliveryMarketplaceController],
  providers: [DeliveryMarketplaceService, DeliveryMarketplaceRepository],
  exports: [DeliveryMarketplaceService, DeliveryMarketplaceRepository],
})
export class DeliveryMarketplaceModule {}
