import { Types } from 'mongoose';

export type VendorItemWithoutStatus = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  itemTotalWeight: number;
  itemSubTotal: number;
};

export type VendorGroup = {
  businessId: string;
  items: VendorItemWithoutStatus[];
  subtotal: number;
  totalWeight: number;
  shippingFee: number;
  originState: string;
};
