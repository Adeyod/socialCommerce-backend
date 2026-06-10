import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Request } from 'express';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import {
  generatePaymentReference,
  platformComm,
} from '../../common/utils/helper';
import { CartRepository } from '../carts/repositories/cart.repository';
import { InventoryRepository } from '../inventory/repositories/inventory.repository';
import { OrderRepository } from '../orders/repositories/order.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletRepository } from '../wallet/repositories/wallet.repository';
import { LedgerCategory } from '../wallet/schemas/ledger.schema';
import { WalletOwnerType } from '../wallet/schemas/wallet.schema';
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
    const findUser = await this.usersRepository.findById(user.sub);

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

  // async handleWebhook(provider: PaymentProvider, req: Request) {
  //   const handler = this.providerMap[provider];

  //   if (!handler) {
  //     throw new BadRequestException({
  //       message: 'Unsupported provider.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const providerResponse = await handler.handleWebhook(req);

  //   if (providerResponse.event !== 'charge.success') {
  //     return { message: 'Payment not successful.' };
  //   }

  //   if (providerResponse.event === 'charge.success') {
  //     // GET ACCOUNT USING ACCOUNT ID AND USER ID
  //     const {
  //       reference,
  //       status,
  //       created_at,
  //       metadata: { amount, userId, email },
  //       // authorization: { bank, account_name },
  //     } = providerResponse.data;

  //     const amt = parseFloat(amount.toString().replace(/,/g, ''));

  //     if (isNaN(amt)) {
  //       throw new BadRequestException({
  //         message: 'Invalid amount provided. Please provide a valid number',
  //         status: 400,
  //         success: false,
  //       });
  //     }

  //     const user = new Types.ObjectId(userId);

  //     const payment = await this.paymentsRepository.getPaymentByRefAndUserId(
  //       reference,
  //       user,
  //     );

  //     if (!payment) {
  //       throw new NotFoundException({
  //         message: 'Payment document not found.',
  //         status: 404,
  //         success: false,
  //       });
  //     }

  //     if (payment.verified) {
  //       return { message: 'Payment already processed.' };
  //     }

  //     const verifyResponse = await handler.verifyPayment(reference);

  //     const {
  //       status: _status,
  //       reference: _ref,
  //       amount: _amt,
  //       metadata: {
  //         email: _email,
  //         amount: _amount,
  //         reference: _reference,
  //         userId: _userId,
  //       },
  //     } = verifyResponse;

  //     if (_status === 'success') {
  //       payment.verified = true;
  //       if (payment.status === PaymentStatus.PENDING) {
  //         const paymentUpdateRes =
  //           await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
  //             payment._id,
  //             PaymentStatus.SUCCESSFUL,
  //           );

  //         if (!paymentUpdateRes) {
  //           throw new BadRequestException({
  //             message: 'Unable to process payment webhook.',
  //             success: false,
  //             status: 400,
  //           });
  //         }

  //         const userExist = await this.usersRepository.findById(user);
  //         if (!userExist) {
  //           throw new NotFoundException({
  //             message: 'User not found.',
  //             success: false,
  //             status: 404,
  //           });
  //         }

  //         userExist.plans.push(payment.plan);
  //         const userId = userExist._id.toString();
  //         const formattedAmt = amount / 100;
  //         const payRefferalBonus =
  //           await this.referralsService.processReferralReward(
  //             userId,
  //             formattedAmt,
  //           );
  //       }
  //       await payment.save();
  //     }

  //     return { message: 'successful' };
  //   }
  // }

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
      await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
        payment._id,
        PaymentStatus.successful,
        session,
      );

      // 2. Fetch user inside transaction
      const userExist = await this.usersRepository.findById(userObjectId);

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

      const order = await this.orderRepository.findOrderByOrderId(orderId);

      if (!order) {
        throw new NotFoundException({
          message: 'Order not found.',
          success: false,
          status: 404,
        });
      }

      // ===============================
      // VENDOR WALLET DISTRIBUTION
      // ===============================

      let platformCharge: number = 0;
      const shipment = order.shipment;

      for (const vendor of shipment.vendors) {
        let vendorSubtotal = 0;

        // calculate vendor revenue from items
        for (const item of vendor.items) {
          // const productInventory = await this.inventoryRepository.findInventoryByProductId(item.productId)

          // if(!productInventory) {
          //   throw new NotFoundException({
          //     message: 'Product inventory document not found.',
          //     success: false,
          //     status: 404
          //   })
          // }

          // productInventory.
          vendorSubtotal += item.price * item.quantity;
        }

        const platformCommission = platformComm; // e.g 0.05 or 0.1

        const fee = platformCommission * vendorSubtotal;
        platformCharge += fee;

        const vendorFee = vendorSubtotal - fee;

        const payload = {
          userId: vendor.businessId.toString(),
          orderId,
        };

        await this.walletRepository.creditWalletPendingBalance(
          {
            ownerType: WalletOwnerType.business,
            businessId: vendor.businessId.toString(),
          },
          vendorFee,
          generatePaymentReference(payload),
          LedgerCategory.order_payment,
        );
      }

      await this.walletRepository.creditWalletPendingBalance(
        {
          ownerType: WalletOwnerType.platform,
        },
        platformCharge,
        generatePaymentReference({ userId: 'platform_fee', orderId }),
        LedgerCategory.platform_fee,
      );
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
