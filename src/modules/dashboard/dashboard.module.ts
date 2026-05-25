import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CartsModule } from '../carts/carts.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [OrdersModule, CartsModule, ProductsModule, BusinessesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
