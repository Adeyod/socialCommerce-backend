import { forwardRef, Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { PromotersModule } from '../promoters/promoters.module';
import { RiderModule } from '../rider/rider.module';
import { UsersModule } from '../users/users.module';
import { VendorModule } from '../vendor/vendor.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { PartnersRepository } from './repositories/partners.repository';

@Module({
  imports: [
    BusinessesModule,
    VendorModule,
    RiderModule,
    PromotersModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository],
  exports: [PartnersRepository, PartnersService],
})
export class PartnersModule {}
