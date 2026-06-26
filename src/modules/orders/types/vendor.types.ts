import { Types } from 'mongoose';
import { MediaType } from '../../products/enums/product.enum';

export type VendorItemWithoutStatus = {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  itemTotalWeight: number;
  itemSubTotal: number;
  media: [MediaType];
};

export type VendorGroup = {
  businessId: string;
  items: VendorItemWithoutStatus[];
  subtotal: number;
  totalWeight: number;
  shippingFee: number;
  originState: string;
};
