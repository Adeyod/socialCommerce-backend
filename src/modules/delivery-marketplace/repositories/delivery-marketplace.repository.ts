import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryMarketplace,
  DeliveryMarketplaceDocument,
  MarketplaceStatus,
} from '../schemas/delivery-marketplace.schema';

@Injectable()
export class DeliveryMarketplaceRepository {
  constructor(
    @InjectModel(DeliveryMarketplace.name)
    private readonly deliveryMarketplaceModel: Model<DeliveryMarketplaceDocument>,
  ) {}

  async publishDelivery(deliveryId: Types.ObjectId) {
    const response = await new this.deliveryMarketplaceModel({
      deliveryId: deliveryId,
      status: MarketplaceStatus.open,
      notifiedRiders: [],
      selectedRider: null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).save();

    return response;
  }

  // find nearby riders
  // notify the riders
  // handle rider competition logic
  // timeout logic(if no one picks)
  // re-broadcast logic
}
