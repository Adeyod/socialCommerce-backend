import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  ShipmentEntity,
  ShipmentEntityDocument,
} from '../schemas/shipment.schema';

@Injectable()
export class ShipmentRepository {
  constructor(
    @InjectModel(ShipmentEntity.name)
    private readonly shipmentEntityModel: Model<ShipmentEntityDocument>,
  ) {}

  async createShipmentFromOrder(orderId: string, session: ClientSession) {
    const response = await new this.shipmentEntityModel({
      orderId: new Types.ObjectId(orderId),
    }).save();

    return response;
  }
  async findByOrderId(orderId: string, session: ClientSession) {
    const response = await this.shipmentEntityModel
      .findOne({
        orderId: new Types.ObjectId(orderId),
      })
      .session(session);

    return response;
  }
}
