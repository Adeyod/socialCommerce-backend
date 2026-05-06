import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessesRepository } from './repositories/businesses.repository';
import { Business, BusinessSchema } from './schemas/business.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService, BusinessesRepository],
  exports: [BusinessesRepository],
})
export class BusinessesModule {}
