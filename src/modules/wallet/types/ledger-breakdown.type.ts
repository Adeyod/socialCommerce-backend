import { Types } from 'mongoose';

export type LedgerBreakdownType = {
  productId: Types.ObjectId;
  name?: string;
  unitPrice: number;
  quantity: number;
  total: number;
  shippingFee: number;
  commission: number;
  netAmount: number;
};
