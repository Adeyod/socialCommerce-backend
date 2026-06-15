import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PickupCenterModule } from '../pickup-center/pickup-center.module';
import { HomeDeliveryController } from './home-delivery.controller';
import { HomeDeliveryService } from './home-delivery.service';
import { HomeDeliveryRepository } from './repositories/home-delivery.repository';
import {
  HomeDeliveryFee,
  HomeDeliveryFeeSchema,
} from './schemas/home-delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeDeliveryFee.name, schema: HomeDeliveryFeeSchema },
    ]),
    forwardRef(() => PickupCenterModule),
  ],
  controllers: [HomeDeliveryController],
  providers: [HomeDeliveryService, HomeDeliveryRepository],
  exports: [HomeDeliveryService, HomeDeliveryRepository],
})
export class HomeDeliveryModule {}
