import { Module } from '@nestjs/common';
import { BusinessShippingRateModule } from '../business-shipping-rate/business-shipping-rate.module';
import { ProductsModule } from '../products/products.module';
import { BuyersController } from './buyers.controller';
import { BuyersService } from './buyers.service';
import { BuyersRepository } from './repositories/buyer.repository';

@Module({
  imports: [ProductsModule, BusinessShippingRateModule],
  controllers: [BuyersController],
  providers: [BuyersService, BuyersRepository],
})
export class BuyersModule {}
