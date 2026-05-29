import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessShippingRateController } from './business-shipping-rate.controller';
import { BusinessShippingRateService } from './business-shipping-rate.service';
import { BusinessShippingRateRepository } from './repositories/business-shipping-rate.repository';
import {
  BusinessShippingRate,
  BusinessShippingRateSchema,
} from './schemas/business-shipping-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessShippingRate.name, schema: BusinessShippingRateSchema },
    ]),
  ],
  controllers: [BusinessShippingRateController],
  providers: [BusinessShippingRateService, BusinessShippingRateRepository],
  exports: [BusinessShippingRateService, BusinessShippingRateRepository],
})
export class BusinessShippingRateModule {}
