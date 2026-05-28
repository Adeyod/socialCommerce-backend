import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionFeeRepository } from './repositories/collection-fee.repository';
import {
  CollectionFee,
  CollectionFeeSchema,
} from './schemas/collection-fee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollectionFee.name, schema: CollectionFeeSchema },
    ]),
  ],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionFeeRepository],
  exports: [CollectionService, CollectionFeeRepository],
})
export class CollectionModule {}
