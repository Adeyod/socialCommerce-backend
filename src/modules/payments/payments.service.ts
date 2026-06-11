import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection } from '@nestjs/mongoose';
import { Request } from 'express';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { OrderEvents } from '../../common/events/order.events';
import { JwtUser } from '../../common/types/jwt-user.type';
import {
  generatePaymentReference,
  platformComm,
} from '../../common/utils/helper';
import { CartRepository } from '../carts/repositories/cart.repository';
import { InventoryRepository } from '../inventory/repositories/inventory.repository';
import { OrderRepository } from '../orders/repositories/order.repository';
import { OrderStatus } from '../orders/schemas/order.schema';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletRepository } from '../wallet/repositories/wallet.repository';
import { LedgerCategory } from '../wallet/schemas/ledger.schema';
import { WalletOwnerType } from '../wallet/schemas/wallet.schema';
import { LedgerBreakdownType } from '../wallet/types/ledger-breakdown.type';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { IPaymentProvider } from './providers/interfaces/provider.interface';
import { PaystackService } from './providers/paystack/paystack.service';
import { PaymentsRepository } from './repositories/payment.repository';
import { PaymentProvider, PaymentStatus } from './schemas/payment.schema';
import { PaymentBreakdown } from './types/payment-breakdown.type';

@Injectable()
export class PaymentsService {
  private providerMap: Record<PaymentProvider, IPaymentProvider>;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly cartRepository: CartRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystackService: PaystackService,
    // private readonly flutterwaveService: flutterwaveService,
    private usersRepository: UsersRepository,
    private orderRepository: OrderRepository,
    private walletRepository: WalletRepository,
    private inventoryRepository: InventoryRepository,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async createPaymentIntent(
    provider: PaymentProvider,
    user: JwtUser,
    order: string,
    amount: number,
    paymentBreakdown: PaymentBreakdown,
  ) {
    const findUser = await this.usersRepository.findUserByIdWithoutSession(
      user.sub,
    );

    if (!findUser) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const orderId = new Types.ObjectId(order);

    const alreadyPaid =
      await this.paymentsRepository.findSuccessfulPaymentByUserIdAndOrderId(
        findUser._id,
        orderId,
      );

    if (alreadyPaid) {
      throw new UnauthorizedException({
        message: 'Order has already being paid.',
        success: false,
        status: 401,
      });
    }

    const status = PaymentStatus.pending;

    const findIntent =
      await this.paymentsRepository.existingPendingPaymentUsingUserIdAndOrderId(
        findUser._id,
        orderId,
        status,
      );

    if (findIntent) {
      if (findIntent.expiresAt < new Date()) {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      } else if (findIntent.provider === provider) {
        return {
          provider: findIntent.provider,
          reference: findIntent.reference,
          paymentUrl: findIntent.authorizationUrl,
        };
      } else {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      }
    }
    const createIntent = await this.paymentsRepository.createPaymentIntent(
      findUser._id,
      provider,
      orderId,
      amount,
      paymentBreakdown,
    );

    if (!createIntent) {
      throw new BadRequestException({
        message: 'Unable to create payment document',
        success: false,
        status: 400,
      });
    }

    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.initializePayment({
      email: user.email,
      amount: createIntent.amount * 100,
      reference: createIntent.reference,
      userId: findUser._id.toString(),
      orderId: createIntent.orderId.toString(),
      paymentBreakdown,
    });

    const updateIntent = await this.paymentsRepository.updateIntentWithAuthUrl(
      createIntent._id,
      providerResponse.paymentUrl,
      providerResponse.providerReference,
    );
    return providerResponse;
  }
  async handleWebhook(provider: PaymentProvider, req: Request) {
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleWebhook(req);

    if (providerResponse.event !== 'charge.success') {
      return { message: 'Payment not successful.' };
    }

    const {
      reference,
      metadata: { amount, userId, orderId, paymentBreakdown },
    } = providerResponse.data;

    const amt = Number(String(amount).replace(/,/g, ''));

    if (isNaN(amt)) {
      throw new BadRequestException({
        message: 'Invalid amount provided.',
        status: 400,
        success: false,
      });
    }

    const userObjectId = new Types.ObjectId(userId);
    const order = new Types.ObjectId(orderId);

    const payment =
      await this.paymentsRepository.getPaymentByRefUserIdAndOrderId(
        userObjectId,
        order,
        reference,
      );

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment document not found.',
        status: 404,
        success: false,
      });
    }

    if (payment.verified) {
      return { message: 'Payment already processed.' };
    }

    const verifyResponse = await handler.verifyPayment(reference);

    if (verifyResponse.status !== 'success') {
      return { message: 'Payment verification failed.' };
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Update payment ONLY ONCE (single source of truth)
      const updatedPayment =
        await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
          payment._id,
          PaymentStatus.successful,
          session,
        );

      // 2. Fetch user inside transaction
      const userExist = await this.usersRepository.findById(
        userObjectId,
        session,
      );

      if (!userExist) {
        throw new NotFoundException({
          message: 'User not found.',
          success: false,
          status: 404,
        });
      }

      /**
       * This is where i will credit wallet of sellers
       */

      const orderDoc = await this.orderRepository.findOrderByOrderId(
        order.toString(),
        session,
      );

      if (!orderDoc) {
        throw new NotFoundException({
          message: 'Order not found.',
          success: false,
          status: 404,
        });
      }

      // ===============================
      // VENDOR WALLET DISTRIBUTION
      // ===============================

      const shipment = orderDoc.shipment;

      if (!shipment || !shipment.vendors.length) {
        throw new BadRequestException({
          message: 'Invalid shipment data.',
          success: false,
          status: 400,
        });
      }

      let platformCharge: number = 0;

      for (const vendor of shipment.vendors) {
        let computedSubtotal = 0;
        const breakdown: LedgerBreakdownType[] = [];

        // calculate vendor revenue from items
        for (const item of vendor.items) {
          const productInventory =
            await this.inventoryRepository.findInventoryByProductId(
              item.productId.toString(),
              session,
            );

          if (!productInventory) {
            throw new NotFoundException({
              message: 'Product inventory document not found.',
              success: false,
              status: 404,
            });
          }

          // productInventory.

          const itemTotal = item.price * item.quantity;

          const commission = platformComm * itemTotal;
          const net = itemTotal - commission;

          computedSubtotal += itemTotal;

          breakdown.push({
            productId: item.productId,
            name: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            total: itemTotal + vendor.shippingFee,
            commission,
            shippingFee: vendor.shippingFee,
            netAmount: net,
          });
        }

        if (computedSubtotal !== vendor.subtotal) {
          throw new BadRequestException({
            message: 'Vendor subtotal mismatch.',
            success: false,
            status: 400,
          });
        }

        const vendorNetTotal = breakdown.reduce(
          (sum, item) => sum + item.netAmount,
          0,
        );

        const vendorCommissionTotal = breakdown.reduce(
          (sum, item) => sum + item.commission,
          0,
        );

        platformCharge += vendorCommissionTotal;

        const referenceId = `order_${orderId}_vendor_${vendor.businessId.toString()}`;

        const payload = {
          userId: vendor.businessId.toString(),
          orderId,
        };

        await this.walletRepository.creditWalletPendingBalance(
          {
            ownerType: WalletOwnerType.business,
            businessId: vendor.businessId.toString(),
          },
          vendorNetTotal,
          referenceId,
          LedgerCategory.order_payment,
          {
            orderId,
            breakdown,
          },
          session,
        );
      }

      const payObj: PaymentBreakdown = paymentBreakdown;

      const collectionFee: number = payObj.platformFees.collectionFee;

      const deliveryFee: number = payObj.platformFees.deliveryFee;

      const platformTotal: number =
        platformCharge + collectionFee + deliveryFee;

      await this.walletRepository.creditWalletPendingBalance(
        {
          ownerType: WalletOwnerType.platform,
        },
        platformTotal,
        generatePaymentReference({ userId: 'platform_fee', orderId }),
        LedgerCategory.platform_fee,
        {
          orderId,
          platformCharge,
          deliveryFee,
          collectionFee,
        },
        session,
      );

      orderDoc.status = OrderStatus.paid;
      orderDoc.isPaid = true;
      orderDoc.paidAt = new Date();
      await orderDoc.save({ session });
      await userExist.save({ session });

      // 4. Commit DB changes FIRST
      await session.commitTransaction();

      // 5. Mark payment verified (outside transaction since already committed)
      payment.verified = true;
      await payment.save();

      const clearCart = await this.cartRepository.clearCart(
        userExist._id.toString(),
      );

      // Create notification here(to notify vendor of the order)

      this.eventEmitter.emit(OrderEvents.order_paid, {
        orderId: orderDoc._id.toString(),
        shipment: orderDoc.shipment,
      });

      return { message: 'successful' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async verifyPayment(reference: string, user: JwtUser) {
    // 1 CHECK DB FIRST (faster + avoids unnecessary provider calls)
    const transaction =
      await this.paymentsRepository.findPaymentTransactionByReference(
        reference,
      );

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    // Ownership check
    if (transaction.userId.toString() !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You are not authorized to access this transaction.',
        success: false,
        status: 403,
      });
    }

    // 2️⃣ IDEMPOTENCY CHECK (webhook might have already processed it)
    if (transaction.status === 'successful') {
      return {
        message: 'Payment already verified.',
        success: true,
        status: 200,
        data: transaction,
      };
    }

    const provider = transaction.provider;
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    // 3️⃣ VERIFY WITH PROVIDER (fallback if webhook hasn't hit yet)
    const providerRes = await handler.verifyPayment(reference);

    if (!providerRes || providerRes.status !== 'success') {
      throw new BadRequestException({
        message: 'Payment not successful yet.',
        success: false,
        status: 400,
      });
    }

    // 4️⃣ VALIDATE DATA INTEGRITY
    if (transaction.amount !== providerRes.amount) {
      throw new BadRequestException({
        message: 'Payment details mismatch.',
        success: false,
        status: 400,
      });
    }

    // 5️⃣ ONLY UPDATE STATUS (DO NOT CALL BUSINESS LOGIC)
    transaction.status = PaymentStatus.successful;
    // transaction.providerResponse = providerRes;

    await transaction.save();

    return {
      message: 'Payment verified successfully.',
      success: true,
      status: 200,
      provider: transaction?.provider,
    };
  }

  async getAllPaymentsOfAUserByUserId(
    user: JwtUser,
    userId: string,
  ): Promise<PaymentResponseDto[]> {
    const { sub, role } = user;

    if (role !== Role.admin) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your payments.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const payments =
      await this.paymentsRepository.getAllPaymentsOfAUserWithUserId(id);

    if (!payments) {
      throw new NotFoundException({
        message: 'No payment found for this user',
        success: false,
        status: 404,
      });
    }
    return payments;
  }

  async getAllPayments(queryWithPaginationDto: QueryWithPaginationDto) {
    const payments = await this.paymentsRepository.getAllPayments(
      queryWithPaginationDto,
    );

    if (!payments.paymentObj || payments.paymentObj.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    return payments;
  }
}
