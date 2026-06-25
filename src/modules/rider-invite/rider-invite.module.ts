import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';
import { RiderModule } from '../rider/rider.module';
import { StaffAccessControlModule } from '../staff-access-control/staff-access-control.module';
import { UsersModule } from '../users/users.module';
import { RiderInviteRepository } from './repositories/rider-invite.repository';
import { RiderInviteController } from './rider-invite.controller';
import { RiderInviteService } from './rider-invite.service';
import { RiderInvite, RiderInviteSchema } from './schemas/rider-invite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RiderInvite.name, schema: RiderInviteSchema },
    ]),
    RiderModule,
    UsersModule,
    BusinessesModule,
    StaffAccessControlModule,
  ],
  controllers: [RiderInviteController],
  providers: [RiderInviteService, RiderInviteRepository],
  exports: [RiderInviteService, RiderInviteRepository],
})
export class RiderInviteModule {}
