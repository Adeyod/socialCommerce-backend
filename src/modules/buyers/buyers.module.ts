import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { BuyersController } from './buyers.controller';
import { BuyersService } from './buyers.service';
import { BuyersRepository } from './repositories/buyer.repository';

@Module({
  imports: [ProductsModule],
  controllers: [BuyersController],
  providers: [BuyersService, BuyersRepository],
})
export class BuyersModule {}
