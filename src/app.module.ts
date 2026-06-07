import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './common/infrastructure/cloudinary/cloudinary.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import configuration from './config/configuration';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessShippingRateModule } from './modules/business-shipping-rate/business-shipping-rate.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { BuyersModule } from './modules/buyers/buyers.module';
import { CartsModule } from './modules/carts/carts.module';
import { CollectionModule } from './modules/collection/collection.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DeliveryMarketplaceModule } from './modules/delivery-marketplace/delivery-marketplace.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { HomeDeliveryModule } from './modules/home-delivery/home-delivery.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PartnersModule } from './modules/partners/partners.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PickupCenterModule } from './modules/pickup-center/pickup-center.module';
import { ProductsModule } from './modules/products/products.module';
import { PromotersModule } from './modules/promoters/promoters.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RiderModule } from './modules/rider/rider.module';
import { StaffAccessControlModule } from './modules/staff-access-control/staff-access-control.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { UsersModule } from './modules/users/users.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        MONGO_URI: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),

        connectionFactory: (connection) => {
          if (connection.readyState === 1) {
            console.log(`MongoDB connected to database: ${connection.name}`);
          }

          connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected...');
          });

          connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
          });

          connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
          });

          return connection;
        },
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          const redisArray = redisUrl.split(':');

          const url = new URL(redisUrl);

          return {
            redis: {
              host: url.hostname,
              port: Number(url.port),
              maxRetriesPerRequest: null,
            },
          };
        }

        console.log('Using default Redis localhost:6379');
        return {
          redis: {
            host: '127.0.0.1',
            port: 6379,
          },
        };
      },
    }),

    MailModule,
    AuthModule,
    TokensModule,
    UsersModule,
    RefreshTokensModule,
    CloudinaryModule,
    ProductsModule,
    PaymentsModule,
    BusinessesModule,
    PartnersModule,
    StaffAccessControlModule,
    DiscountsModule,
    ReviewsModule,
    AnalyticsModule,
    DeliveryModule,
    DeliveryMarketplaceModule,
    RiderModule,
    VendorModule,
    PromotersModule,
    OrdersModule,
    BuyersModule,
    CartsModule,
    NotificationsModule,
    DashboardModule,
    WalletModule,
    PickupCenterModule,
    CollectionModule,
    BusinessShippingRateModule,
    HomeDeliveryModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
