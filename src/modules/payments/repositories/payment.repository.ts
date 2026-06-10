import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { generatePaymentReference } from '../../../common/utils/helper';
import {
  Payment,
  PaymentDocument,
  PaymentProvider,
  PaymentStatus,
} from '../schemas/payment.schema';
import { PaymentBreakdown } from '../types/payment-breakdown.type';

type PaymentHandlerInput = {
  reference: string;
  amount: number;
  userId: Types.ObjectId;
};

type PaymentHandler = (data: PaymentHandlerInput) => Promise<any>;

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async createPaymentIntent(
    userId: Types.ObjectId,
    provider: PaymentProvider,
    orderId: Types.ObjectId,
    amount: number,
    paymentBreakdown: PaymentBreakdown,
  ) {
    console.log('orderId:', orderId);
    console.log('amount:', amount);

    const payload = {
      orderId,
      userId,
    };
    const reference = generatePaymentReference(payload);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const newPayment = await new this.paymentModel({
      userId,
      orderId,
      expiresAt,
      amount,
      reference,
      provider,
      deliveryMode: paymentBreakdown.deliveryMode,
      deliveryAddress: paymentBreakdown.deliveryAddress,
      vendorsPaymentBreakdown: paymentBreakdown.vendors,
      collectionFee: paymentBreakdown.platformFees.collectionFee,
      deliveryFee: paymentBreakdown.platformFees.deliveryFee,
    }).save();

    console.log('newPayment:', newPayment);

    return newPayment;
  }

  async updatePaymentExpirationUsingPaymentId(
    paymentId: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      {
        isExpired: true,
      },
      {
        returnDocument: 'after',
      },
    );

    return payment;
  }

  async updatePaymentStatusUsingPaymentId(
    paymentId: Types.ObjectId,
    status: PaymentStatus,
    session?: ClientSession,
  ): Promise<PaymentDocument | null> {
    const paidAt = new Date(Date.now());
    console.log('paidAt:', paidAt);
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      {
        status,
        paidAt,
      },
      {
        returnDocument: 'after',
        session,
      },
    );

    return payment;
  }

  async existingPendingPaymentUsingUserIdAndOrderId(
    userId: Types.ObjectId,
    orderId: Types.ObjectId,
    status: PaymentStatus,
  ): Promise<PaymentDocument | null> {
    const existing = await this.paymentModel.findOne({
      userId,
      orderId,
      status,
      expiresAt: { $gt: new Date() },
    });

    return existing;
  }

  async updateIntentWithAuthUrl(
    id: Types.ObjectId,
    authorizationUrl: string,
    providerReference: string,
  ): Promise<PaymentDocument | null> {
    const update = await this.paymentModel.findByIdAndUpdate(
      id,
      {
        authorizationUrl: authorizationUrl,
        providerReference: providerReference,
      },
      { returnDocument: 'after' },
    );

    return update;
  }

  async setPendingPaymentToExpired(
    id: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const updateStatus = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: PaymentStatus.expired },
      { returnDocument: 'after' },
    );

    return updateStatus;
  }

  async findSuccessfulPaymentByUserIdAndOrderId(
    userId: Types.ObjectId,
    orderId: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const intent = await this.paymentModel.findOne({
      userId,
      orderId,
      status: PaymentStatus.successful,
      verified: true,
    });

    return intent;
  }

  async getAllPaymentsOfAUserWithUserId(
    userId: Types.ObjectId,
  ): Promise<PaymentDocument[] | null> {
    const payments = await this.paymentModel.find({ userId });
    console.log('payments:', payments);
    return payments;
  }

  async getAllPayments(
    queryWithPaginationsDto: QueryWithPaginationDto,
  ): Promise<{
    paymentObj: PaymentDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationsDto;

    let query = this.paymentModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [
          { plan: { $regex: regex } },
          { provider: { $regex: regex } },
          { status: { $regex: regex } },
          ...(isBooleanSearch
            ? [{ verified: searchParams.toLowerCase() === 'true' }]
            : []),
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const payments = await query.sort({ createdAt: -1 });

    if (payments.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      paymentObj: payments,
    };

    return response;
  }

  async findPaymentTransactionByReference(
    reference: string,
  ): Promise<PaymentDocument | null> {
    const paymentTransaction = await this.paymentModel.findOne({
      providerReference: reference,
    });

    return paymentTransaction;
  }

  async getPaymentByRefUserIdAndOrderId(
    userId: Types.ObjectId,
    orderId: Types.ObjectId,
    ref: string,
  ) {
    const user = new Types.ObjectId(userId);
    const order = new Types.ObjectId(orderId);

    const paymentTransaction = await this.paymentModel.findOne({
      providerReference: ref,
      userId,
      orderId,
    });

    return paymentTransaction;
  }

  async findPaymentByOrderId(orderId: string): Promise<PaymentDocument | null> {
    const id = new Types.ObjectId(orderId);
    const response = await this.paymentModel.findOne({
      orderId: id,
    });

    return response;
  }
}
