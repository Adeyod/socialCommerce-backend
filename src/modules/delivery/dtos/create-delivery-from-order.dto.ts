import { Types } from 'mongoose';
import { DeliveryStatus } from '../schemas/delivery.schema';

export class CreateDeliveryFromOrderDto {
  orderId!: Types.ObjectId;
  dropoffAddress?: string;
  deliveryMode!: string;
  pickupPoints!: {
    businessId: string;
    address: string;
    isPickedUp: boolean;
  }[];
  status!: DeliveryStatus;
}
