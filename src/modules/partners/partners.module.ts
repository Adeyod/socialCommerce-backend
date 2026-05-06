import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';
import { UsersModule } from '../users/users.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { PartnersRepository } from './repositories/partners.repository';
import {
  PromoterProfile,
  PromoterProfileSchema,
} from './schemas/promoter-profile.schema';
import {
  RiderProfile,
  RiderProfileSchema,
} from './schemas/rider-profile.schema';
import {
  VendorProfile,
  VendorProfileSchema,
} from './schemas/vendor-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorProfile.name, schema: VendorProfileSchema },
      { name: RiderProfile.name, schema: RiderProfileSchema },
      { name: PromoterProfile.name, schema: PromoterProfileSchema },
    ]),
    BusinessesModule,
    UsersModule,
  ],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository],
})
export class PartnersModule {}
