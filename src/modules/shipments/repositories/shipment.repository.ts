import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { DeliveryMode } from '../../orders/schemas/order.schema';
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

  async createShipmentFromOrder(
    payload: {
      orderId: Types.ObjectId;
      customerId: Types.ObjectId;
      deliveryMode: DeliveryMode;
      deliveryFee: number;
      subtotal: number;
      destinationPickupCenter: Types.ObjectId;
    },
    session: ClientSession,
  ) {
    const response = await new this.shipmentEntityModel({
      orderId: payload.orderId,
      customerId: payload.customerId,
      deliveryMode: payload.deliveryMode,
      deliveryFee: payload.deliveryFee,
      subtotal: payload.subtotal,
      destinationPickupCenter: payload.destinationPickupCenter,
    }).save({ session });

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
