import { Types } from 'mongoose';
import { BusinessAddress } from '../../businesses/schemas/business.schema';
import { CreateVendorOrderDto } from '../dtos/create-order.dto';
import {
  DeliveryAddress,
  DeliveryMode,
  OrderStatus,
  ShipmentStatus,
  VendorItemOrderStatus,
  VendorOrderStatus,
} from '../schemas/order.schema';

export type ProcessedVendorOrder = CreateVendorOrderDto & {
  businessAddress: BusinessAddress;
};

export type VendorItem = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  itemStatus: VendorItemOrderStatus;
};

export type VendorObject = {
  businessId: string;
  items: VendorItem[];
  subtotal: number;
  status: VendorOrderStatus;
};

export type ShipmentDto = {
  shipmentId: string;
  originPickupCenter: string;
  destinationPickupCenter?: string;
  deliveryMode: DeliveryMode;
  vendors: VendorObject[];
  subtotal: number;
  // deliveryFee: number;
  status: ShipmentStatus;
};

export type ProcessedOrderData = {
  cartId: string;
  customerId: string;

  shipments: ShipmentDto[];
  subtotal: number;
  deliveryFee: number;
  total: number;

  deliveryMode: DeliveryMode;
  deliveryAddress: DeliveryAddress;
  destinationPickupCenter?: string;

  contactPhone: string;

  isPaid: boolean;
  status: OrderStatus;

  idempotencyKey: string;
};
