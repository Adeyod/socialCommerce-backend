import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PickupCenterController } from './pickup-center.controller';
import { PickupCenterService } from './pickup-center.service';
import { PickupCenterRepository } from './repositories/pickup-center.repository';
import {
  PickupCenter,
  PickupCenterSchema,
} from './schemas/pickup-center.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PickupCenter.name, schema: PickupCenterSchema },
    ]),
  ],
  controllers: [PickupCenterController],
  providers: [PickupCenterService, PickupCenterRepository],
  exports: [PickupCenterService, PickupCenterRepository],
})
export class PickupCenterModule {}
