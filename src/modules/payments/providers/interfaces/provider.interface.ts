import { Request } from 'express';
import { PaymentBreakdown } from '../../types/payment-breakdown.type';

export interface PaymentInitializationPayload {
  email: string;
  amount: number;
  reference: string;
  userId: string;
  orderId: string;
  paymentBreakdown: PaymentBreakdown;
}

export interface PaymentProviderResponse {
  paymentUrl: string;
  reference: string;
  provider: string;
  providerReference: string;
}

export interface IPaymentProvider {
  initializePayment(
    payload: PaymentInitializationPayload,
  ): Promise<PaymentProviderResponse>;

  verifyPayment(reference: string): Promise<any>;

  handleWebhook(req: Request): Promise<any>;
}
