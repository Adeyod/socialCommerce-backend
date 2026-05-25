import { BusinessAddress } from '../../businesses/schemas/business.schema';
import { CreateVendorOrderDto } from '../dtos/create-order.dto';

export type ProcessedVendorOrder = CreateVendorOrderDto & {
  businessAddress: BusinessAddress;
};

export type ProcessedOrderData = {
  subtotal: number;
  total: number;
  isPaid: boolean;
  // notes: string;
  cartId: string;
  customerId: string;
  items: CreateVendorOrderDto[];
  deliveryFee: number;
  deliveryAddress: string;
  idempotencyKey: string;
  contactPhone: string;
};
