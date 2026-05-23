import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentsService } from '../payments/payments.service';
import { PaymentsRepository } from '../payments/repositories/payment.repository';
import {
  PaymentProvider,
  PaymentStatus,
} from '../payments/schemas/payment.schema';
import { ProductsRepository } from '../products/repositories/product.repository';
import { Role } from '../users/schemas/user.schema';
import { CreateOrderDto, CreateVendorOrderDto } from './dtos/create-order.dto';
import { OrderRepository } from './repositories/order.repository';
import { OrderStatus, VendorOrderStatus } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly paymentsService: PaymentsService,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  // async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
  //   const {
  //     customerId,
  //     vendorOrders,
  //     deliveryFee,
  //     deliveryAddress,
  //     contactPhone,
  //   } = createOrderDto;

  //   if (user.sub.toString() !== customerId) {
  //     throw new BadRequestException({
  //       message: 'Invalid user. Mis-match',
  //       status: 400,
  //       success: false,
  //     });
  //   }

  //   if (!vendorOrders?.length) {
  //     throw new BadRequestException({
  //       message: 'Cart is empty',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   let globalSubtotal = 0;

  //   const processedVendorOrders: CreateVendorOrderDto[] = [];

  //   for (const vendorOrder of vendorOrders) {
  //     let vendorSubtotal = 0;

  //     const processedItems: {
  //       productId: string;
  //       name: string;
  //       price: number;
  //       quantity: number;
  //     }[] = [];

  //     for (const item of vendorOrder.items) {
  //       const product = await this.productsRepository.findById(item.productId);

  //       if (!product) {
  //         throw new NotFoundException({
  //           message: `Product not found: ${item.productId}`,
  //           success: false,
  //           status: 404,
  //         });
  //       }

  //       const price = product.price * item.quantity;

  //       vendorSubtotal += price;

  //       processedItems.push({
  //         productId: product._id.toString(),
  //         name: product.name,
  //         price: product.price,
  //         quantity: item.quantity,
  //       });
  //     }

  //     globalSubtotal += vendorSubtotal;

  //     processedVendorOrders.push({
  //       businessId: vendorOrder.businessId,
  //       items: processedItems,
  //       subtotal: vendorSubtotal,
  //       status: VendorOrderStatus.pending,
  //     });
  //   }

  //   const total = globalSubtotal + deliveryFee;

  //   const orderPayload = {
  //     customerId,
  //     vendorOrders: processedVendorOrders,
  //     subtotal: globalSubtotal,
  //     deliveryFee,
  //     total,
  //     deliveryAddress,
  //     contactPhone,
  //     status: OrderStatus.pending,
  //     isPaid: false,
  //   };

  //   const order = await this.orderRepository.createOrder(orderPayload);

  //   if (!order) {
  //     throw new BadRequestException({
  //       message: 'Order creation failed',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   return order;
  // }

  async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
    const {
      customerId,
      vendorOrders,
      deliveryFee,
      deliveryAddress,
      contactPhone,
      idempotencyKey,
    } = createOrderDto;

    console.log('createOrderDto:', createOrderDto);
    // 1. AUTH CHECK
    if (user.sub.toString() !== customerId) {
      throw new BadRequestException({
        message: 'Invalid user mismatch',
        success: false,
        status: 400,
      });
    }

    const existingOrder = await this.orderRepository.findOrderByIdempotencyKey(
      idempotencyKey,
      user.sub.toString(),
    );

    if (existingOrder) {
      const paymentMade = await this.paymentsRepository.findPaymentByOrderId(
        existingOrder._id.toString(),
      );

      if (!paymentMade) {
        const newPayment = await this.paymentsService.createPaymentIntent(
          PaymentProvider.PAYSTACK,
          user,
          existingOrder._id.toString(),
          existingOrder.total,
        );

        return {
          order: existingOrder,
          payment: newPayment,
        };
      }

      if (
        existingOrder.isPaid &&
        paymentMade.verified === true &&
        paymentMade.status === PaymentStatus.successful
      ) {
        return {
          order: existingOrder,
          payment: null,
          message: 'Order already paid',
        };
      } else {
        const now = new Date();
        if (paymentMade?.expiresAt && paymentMade.expiresAt < now) {
          await this.paymentsRepository.updatePaymentExpirationUsingPaymentId(
            paymentMade._id,
          );

          const newPayment = await this.paymentsService.createPaymentIntent(
            PaymentProvider.PAYSTACK,
            user,
            existingOrder._id.toString(),
            existingOrder.total,
          );

          return {
            order: existingOrder,
            payment: newPayment,
          };
        }
      }
    }

    if (!vendorOrders?.length) {
      throw new BadRequestException({
        message: 'Cart is empty',
        success: false,
        status: 400,
      });
    }

    let globalSubtotal = 0;

    const processedVendorOrders: CreateVendorOrderDto[] = [];

    // 2. PROCESS EACH VENDOR
    for (const vendorOrder of vendorOrders) {
      let vendorSubtotal = 0;

      const processedItems: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
      }[] = [];

      // 3. PROCESS ITEMS
      for (const item of vendorOrder.items) {
        const product = await this.productsRepository.findById(item.productId);

        if (!product) {
          throw new NotFoundException({
            message: `Product not found: ${item.productId}`,
            success: false,
            status: 404,
          });
        }
        if (!product.inStock) {
          throw new NotFoundException({
            message: `Product ${item.productId} is out of stock`,
            success: false,
            status: 404,
          });
        }

        const price = product.price;

        if (item.quantity <= 0) {
          throw new BadRequestException({
            message: `Invalid quantity for ${product.name}.`,
            status: 400,
            success: false,
          });
        }

        if (item.price && item.price !== price) {
          throw new BadRequestException({
            message: `Price mis-match detected for ${product.name}.`,
            success: false,
            status: 400,
          });
        }

        const itemTotal = price * item.quantity;

        vendorSubtotal += itemTotal;

        processedItems.push({
          productId: product._id.toString(),
          name: product.name,
          price: price,
          quantity: item.quantity,
        });
      }

      globalSubtotal += vendorSubtotal;

      processedVendorOrders.push({
        businessId: vendorOrder.businessId,
        items: processedItems,
        subtotal: vendorSubtotal,
        status: VendorOrderStatus.pending,
      });
    }

    // 4. FINAL TOTAL
    const total = globalSubtotal + deliveryFee;

    const payload = {
      customerId,
      vendorOrders: processedVendorOrders,
      subtotal: globalSubtotal,
      deliveryFee,
      total,
      deliveryAddress,
      contactPhone,
      isPaid: false,
      status: OrderStatus.pending,
      idempotencyKey,
    };

    console.log('order creation payload:', payload);

    // 5. CREATE ORDER
    const order = await this.orderRepository.createOrder(payload);

    if (!order) {
      throw new BadRequestException('Order creation failed');
    }

    const orderId = order._id;
    const provider = PaymentProvider.PAYSTACK;
    const amount = total;

    // create payment intent here for user to pay and return it to the frontend
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      provider,
      user,
      orderId.toString(),
      amount,
    );

    const response = {
      paymentIntent,
      order,
    };

    console.log('response:', response);

    return response;
  }

  async getCustomerOrderDetails(
    buyerId: string,
    orderId: string,
    user: JwtUser,
  ) {
    if (user.role !== Role.admin) {
      if (user.sub.toString() !== buyerId) {
        throw new ForbiddenException({
          message: 'You can only view order that belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const response = await this.orderRepository.findOrderByOrderId(orderId);

    if (!response) {
      throw new NotFoundException({
        message: 'Order not found.',
        success: false,
        status: 404,
      });
    }

    if (response.customerId.toString() !== buyerId) {
      throw new ForbiddenException({
        message: 'You can only view order that belong to you.',
        success: false,
        status: 403,
      });
    }

    return response;
  }
  async getCustomerOrders(
    buyerId: string,
    user: JwtUser,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    if (user.role !== Role.admin) {
      if (user.sub.toString() !== buyerId) {
        throw new ForbiddenException({
          message: 'You can only view orders that belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const response = await this.orderRepository.findOrdersByCustomer(
      user.sub.toString(),
      queryWithPaginationDto,
    );

    return response;
  }

  async getVendorOrdersByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
    user: JwtUser,
  ) {
    const response = await this.orderRepository.findOrdersByBusinessId(
      businessId,
      queryWithPaginationDto,
    );

    return response;
  }
}
