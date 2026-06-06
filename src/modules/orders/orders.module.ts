import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessShippingRateModule } from '../business-shipping-rate/business-shipping-rate.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { CartsModule } from '../carts/carts.module';
import { CollectionModule } from '../collection/collection.module';
import { DeliveryMarketplaceModule } from '../delivery-marketplace/delivery-marketplace.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { HomeDeliveryModule } from '../home-delivery/home-delivery.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PickupCenterModule } from '../pickup-center/pickup-center.module';
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
    DeliveryModule,
    DeliveryMarketplaceModule,
    NotificationsModule,
    BusinessesModule,
    CartsModule,
    CollectionModule,
    BusinessShippingRateModule,
    HomeDeliveryModule,
    InventoryModule,
    PickupCenterModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
  exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
