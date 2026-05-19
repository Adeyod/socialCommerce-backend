import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotersController } from './promoters.controller';
import { PromotersService } from './promoters.service';
import { PromoterProfileRepository } from './repositories/promoter.repository';
import {
  PromoterProfile,
  PromoterProfileSchema,
} from './schemas/promoter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromoterProfile.name, schema: PromoterProfileSchema },
    ]),
  ],
  controllers: [PromotersController],
  providers: [PromotersService, PromoterProfileRepository],
  exports: [PromotersService, PromoterProfileRepository],
})
export class PromotersModule {}
