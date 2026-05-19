import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RiderProfileRepository } from './repositories/rider.repository';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';
import { RiderProfile, RiderProfileSchema } from './schemas/rider.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RiderProfile.name, schema: RiderProfileSchema },
    ]),
  ],
  controllers: [RiderController],
  providers: [RiderService, RiderProfileRepository],
  exports: [RiderService, RiderProfileRepository],
})
export class RiderModule {}
