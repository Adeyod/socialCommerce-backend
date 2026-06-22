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
import {
  InventoryLogDocument,
  InventoryLogType,
} from '../inventory/schemas/inventory-log.schema';
import { OrderRepository } from '../orders/repositories/order.repository';
import { OrderStatus } from '../orders/schemas/order.schema';
import { ProductsRepository } from '../products/repositories/product.repository';
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
    private walletRepository: WalletRepository,
    private inventoryRepository: InventoryRepository,
    private productsRepository: ProductsRepository,
    private readonly orderRepository: OrderRepository,
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
      metadata: { userId, orderId },
    } = providerResponse.data;

    const payment =
      await this.paymentsRepository.getPaymentByRefUserIdAndOrderId(
        new Types.ObjectId(userId),
        new Types.ObjectId(orderId),
        reference,
      );

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment not found.',
        status: 404,
        success: false,
      });
    }

    const verifyResponse = await handler.verifyPayment(reference);

    if (verifyResponse.status !== 'success') {
      return { message: 'Verification failed.' };
    }

    return await this.processSuccessfulPayment(payment);
  }

  async verifyPayment(reference: string, user: JwtUser) {
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

    if (transaction.userId.toString() !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'Unauthorized.',
        success: false,
        status: 403,
      });
    }

    // Already fully processed
    if (transaction.processed) {
      return {
        message: 'Payment already processed.',
        success: true,
        status: 200,
      };
    }

    const handler = this.providerMap[transaction.provider];

    const providerRes = await handler.verifyPayment(reference);

    if (!providerRes || providerRes.status !== 'success') {
      throw new BadRequestException({
        message: 'Payment not successful yet.',
        success: false,
        status: 400,
      });
    }

    if (transaction.amount !== providerRes.amount) {
      throw new BadRequestException({
        message: 'Payment mismatch.',
        success: false,
        status: 400,
      });
    }

    // CRITICAL: now process fully
    return await this.processSuccessfulPayment(transaction);
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

  private async processSuccessfulPayment(payment: any) {
    console.log('processSuccessfulPayment service payload:', payment);
    if (payment.processed) {
      return { message: 'Payment already processed.' };
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const userObjectId = new Types.ObjectId(payment.userId);
      const orderId = new Types.ObjectId(payment.orderId);

      console.log('Comment 1');
      // ===============================
      // FETCH USER + ORDER
      // ===============================
      const [userExist, orderDoc] = await Promise.all([
        this.usersRepository.findById(userObjectId, session),
        this.orderRepository.findOrderByOrderId(orderId.toString(), session),
      ]);

      if (!userExist) {
        throw new NotFoundException({
          message: 'User not found.',
          success: false,
          status: 404,
        });
      }

      if (!orderDoc) {
        throw new NotFoundException({
          message: 'Order not found.',
          success: false,
          status: 404,
        });
      }

      if (orderDoc.isPaid) {
        return { message: 'Order already processed.' };
      }

      const shipment = orderDoc.shipment;

      console.log('Comment 2');

      if (!shipment || !shipment.vendors.length) {
        throw new BadRequestException({
          message: 'Invalid shipment data.',
          success: false,
          status: 400,
        });
      }

      // ===============================
      // COLLECT ALL PRODUCT IDS
      // ===============================
      const allProductIds: string[] = [];

      for (const vendor of shipment.vendors) {
        for (const item of vendor.items) {
          allProductIds.push(item.productId.toString());
        }
      }

      console.log('Comment 3');

      // ===============================
      // FETCH INVENTORIES + PRODUCTS (BULK)
      // ===============================
      const [inventories, products] = await Promise.all([
        this.inventoryRepository.findManyByProductIds(allProductIds, session),
        this.productsRepository.findManyByIds(allProductIds, session),
      ]);

      const inventoryMap = new Map(
        inventories.map((inv) => [inv.productId.toString(), inv]),
      );

      const productMap = new Map(
        products.map((prod) => [prod._id.toString(), prod]),
      );

      console.log('Comment 4');

      // ===============================
      // PREPARE BULK OPS
      // ===============================
      const stockUpdates: { productId: string; quantity: number }[] = [];
      const inventoryLogs: Partial<InventoryLogDocument>[] = [];

      let platformCharge = 0;

      // ===============================
      // VENDOR DISTRIBUTION
      // ===============================
      for (const vendor of shipment.vendors) {
        let computedSubtotal = 0;
        const breakdown: LedgerBreakdownType[] = [];

        console.log('Comment 5');
        for (const item of vendor.items) {
          const productInventory = inventoryMap.get(item.productId.toString());
          const productExist = productMap.get(item.productId.toString());

          if (!productInventory) {
            throw new NotFoundException({
              message: 'Product inventory not found.',
              success: false,
              status: 404,
            });
          }

          if (!productExist) {
            throw new NotFoundException({
              message: 'Product not found.',
              success: false,
              status: 404,
            });
          }

          console.log('Comment 6');

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

          console.log('Comment 7');

          // ATOMIC BULK UPDATE (NO .save())
          stockUpdates.push({
            productId: item.productId.toString(),
            quantity: item.quantity,
          });

          inventoryLogs.push({
            productId: new Types.ObjectId(item.productId),
            businessId: new Types.ObjectId(vendor.businessId),
            type: InventoryLogType.sale,
            quantity: item.quantity,
            reference: orderId.toString(),
          });
        }

        console.log('Comment 8');
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

        const referenceId = `order_${orderId.toString()}_vendor_${vendor.businessId.toString()}`;

        console.log('Comment 9');
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
      console.log('Comment 10');

      // ===============================
      // EXECUTE BULK WRITES
      // ===============================
      await Promise.all([
        this.productsRepository.decrementStockBulk(stockUpdates, session),
        this.inventoryRepository.decrementInventoryBulk(stockUpdates, session),
        this.inventoryRepository.createLogsBulk(inventoryLogs, session),
      ]);

      console.log('Comment 11');

      // ===============================
      // PLATFORM CREDIT
      // ===============================
      const payObj: PaymentBreakdown = payment.paymentBreakdown;

      const collectionFee = payObj.platformFees.collectionFee;
      const deliveryFee = payObj.platformFees.deliveryFee;

      const platformTotal = platformCharge + collectionFee + deliveryFee;

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

      console.log('Comment 12');

      // ===============================
      // FINALIZE ORDER
      // ===============================
      orderDoc.status = OrderStatus.paid;
      orderDoc.isPaid = true;
      orderDoc.paidAt = new Date();

      await orderDoc.save({ session });

      // ===============================
      // MARK PAYMENT
      // ===============================
      payment.status = PaymentStatus.successful;
      payment.processed = true;

      await payment.save({ session });

      // ===============================
      // COMMIT
      // ===============================
      await session.commitTransaction();

      console.log('Comment 13');
      // ===============================
      // POST-COMMIT SIDE EFFECTS
      // ===============================
      await this.cartRepository.clearCart(userObjectId.toString());

      this.eventEmitter.emit(OrderEvents.order_paid, {
        orderId: orderDoc._id.toString(),
        shipment: orderDoc.shipment,
      });

      console.log('Comment 14');
      return { message: 'Payment processed successfully.' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
