import {
  DeliveryAddress,
  DeliveryMode,
} from '../../orders/schemas/order.schema';

export type PaymentVendorBreakdown = {
  businessId: string;
  productTotal: number;
  shippingFee: number;
  total: number;
};

export type PaymentPlatformBreakdown = {
  collectionFee: number;
  deliveryFee: number;
};

export type PaymentBreakdown = {
  vendors: PaymentVendorBreakdown[];
  platformFees: PaymentPlatformBreakdown;

  deliveryMode: DeliveryMode;

  deliveryAddress: DeliveryAddress | null;
  pickupCenter: string | null;
};
