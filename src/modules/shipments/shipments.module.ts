import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShipmentRepository } from './repositories/shipment.repository';
import {
  ShipmentEntity,
  ShipmentEntitySchema,
} from './schemas/shipment.schema';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShipmentEntity.name, schema: ShipmentEntitySchema },
    ]),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentRepository],
  exports: [ShipmentsService, ShipmentRepository],
})
export class ShipmentsModule {}
