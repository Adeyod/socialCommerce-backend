import { Types } from 'mongoose';
import {
  DeliveryMode,
  ShipmentStatus,
  VendorItemOrderStatus,
  VendorOrderStatus,
} from '../schemas/order.schema';

export type ShipmentItem = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  itemStatus: VendorItemOrderStatus;
};

export type ShipmentVendor = {
  _id?: Types.ObjectId;

  businessId: Types.ObjectId;

  items: ShipmentItem[];

  subtotal: number;

  status: VendorOrderStatus;
};

export type Shipment = {
  _id?: Types.ObjectId;

  shipmentId: string;

  originPickupCenter: Types.ObjectId;

  destinationPickupCenter?: Types.ObjectId;

  deliveryMode: DeliveryMode;

  vendors: ShipmentVendor[];

  subtotal: number;

  deliveryFee: number;

  status: ShipmentStatus;
};
