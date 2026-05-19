import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorProfileRepository } from './repositories/vendor.repository';
import { VendorProfile, VendorProfileSchema } from './schemas/vendor.schema';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorProfile.name, schema: VendorProfileSchema },
    ]),
  ],
  controllers: [VendorController],
  providers: [VendorService, VendorProfileRepository],
  exports: [VendorService, VendorProfileRepository],
})
export class VendorModule {}
