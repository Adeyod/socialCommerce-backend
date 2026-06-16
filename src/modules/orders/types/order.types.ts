import { Types } from 'mongoose';
import { VendorItemOrderStatus } from '../schemas/item-vendor-order.schema';
import { DeliveryMode, ShipmentStatus } from '../schemas/order.schema';
import { VendorOrderStatus } from '../schemas/vendor-order.schema';

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
  shippingFee: number;

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
