import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';
import { CartsModule } from '../carts/carts.module';
import { DeliveryMarketplaceModule } from '../delivery-marketplace/delivery-marketplace.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
import { StaffAccessControlModule } from '../staff-access-control/staff-access-control.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRepository } from './repositories/order.repository';
import { Order, OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProductsModule,
    StaffAccessControlModule,
    PaymentsModule,
    DeliveryModule,
    DeliveryMarketplaceModule,
    NotificationsModule,
    BusinessesModule,
    CartsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
})
export class OrdersModule {}
