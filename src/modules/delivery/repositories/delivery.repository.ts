import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDeliveryFromOrderDto } from '../dtos/create-delivery-from-order.dto';
import { Delivery, DeliveryDocument } from '../schemas/delivery.schema';

@Injectable()
export class DeliveryRepository {
  constructor(
    @InjectModel(Delivery.name)
    private readonly deliveryModel: Model<DeliveryDocument>,
  ) {}
  async createDeliveryFromOrder(
    order: CreateDeliveryFromOrderDto,
  ): Promise<DeliveryDocument> {
    const delivery = await new this.deliveryModel({
      orderId: order.orderId,
      dropoffAddress: order.dropoffAddress,
      pickupPoints: order.pickupPoints,
      deliveryMode: order.deliveryMode,
      status: order.status,
    }).save();

    return delivery;
  }
}
