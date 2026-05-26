import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CartRepository } from '../carts/repositories/cart.repository';
import { DeliveryMarketplaceRepository } from '../delivery-marketplace/repositories/delivery-marketplace.repository';
import { DeliveryRepository } from '../delivery/repositories/delivery.repository';
import { DeliveryStatus } from '../delivery/schemas/delivery.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentsRepository } from '../payments/repositories/payment.repository';
import {
  PaymentProvider,
  PaymentStatus,
} from '../payments/schemas/payment.schema';
import { ProductsRepository } from '../products/repositories/product.repository';
import { Role } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderRepository } from './repositories/order.repository';
import {
  DeliveryMode,
  OrderStatus,
  VendorItemOrderStatus,
  VendorOrderStatus,
} from './schemas/order.schema';
import { ProcessedVendorOrder } from './types/processed-vendor.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly deliveryRepository: DeliveryRepository,
    private readonly deliveryMarketplaceRepository: DeliveryMarketplaceRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
    const {
      customerId,
      items,
      deliveryFee,
      deliveryAddress,
      contactPhone,
      idempotencyKey,
      cartId,
      deliveryMode,
      pickupCenter,
    } = createOrderDto;

    // 1. AUTH CHECK
    if (user.sub.toString() !== customerId) {
      throw new BadRequestException({
        message: 'Invalid user mismatch',
        success: false,
        status: 400,
      });
    }

    if (deliveryMode === DeliveryMode.pickUpFromOurNearestOffice) {
      if (!pickupCenter) {
        throw new BadRequestException({
          message: 'Pickup center is required.',
          success: false,
          status: 400,
        });
      }
    }

    if (deliveryMode === DeliveryMode.homeDelivery) {
      if (!deliveryAddress) {
        throw new BadRequestException({
          message: 'Delivery address is required.',
          success: false,
          status: 400,
        });
      }
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

    const cartExist = await this.cartRepository.getCartByCartIdAndUserId(
      cartId,
      user.sub.toString(),
    );

    if (!cartExist) {
      throw new NotFoundException({
        message: 'Cart not found.',
        success: false,
        status: 404,
      });
    }

    const cartItemsMap = new Map(
      cartExist.items.map((item) => [
        item.productId.toString(),
        {
          quantity: item.quantity,
          businessId: item.businessId.toString(),
        },
      ]),
    );

    if (!items?.length) {
      throw new BadRequestException({
        message: 'Cart is empty',
        success: false,
        status: 400,
      });
    }

    for (const item of items) {
      const cartItem = cartItemsMap.get(item.productId.toString());

      if (!cartItem) {
        throw new BadRequestException({
          message: `Product ${item.productId} not found in cart`,
          success: false,
          status: 400,
        });
      }

      if (cartItem.quantity !== item.quantity) {
        throw new BadRequestException({
          message: `Quantity mismatch for product ${item.productId}`,
          success: false,
          status: 400,
        });
      }

      if (cartItem.businessId !== item.businessId.toString()) {
        throw new BadRequestException({
          message: `Business mismatch for product ${item.productId}`,
          success: false,
          status: 400,
        });
      }
    }

    // Optional: Ensure no extra items are missing
    if (items.length !== cartExist.items.length) {
      throw new BadRequestException({
        message: 'Cart items mismatch',
        success: false,
        status: 400,
      });
    }

    let globalSubtotal = 0;

    const processedVendorOrders: ProcessedVendorOrder[] = [];

    const businessIds = items.map((v) => v.businessId);

    const businesses =
      await this.businessesRepository.findBusinessesByIds(businessIds);

    // 2. PROCESS EACH VENDOR
    for (const vendor of items) {
      let vendorSubtotal = 0;

      const processedItems: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
      }[] = [];

      const product = await this.productsRepository.findById(vendor.productId);

      if (!product) {
        throw new NotFoundException({
          message: `Product not found: ${vendor.productId}`,
          success: false,
          status: 404,
        });
      }

      if (!product.inStock) {
        throw new NotFoundException({
          message: `Product ${product.name} is out of stock`,
          success: false,
          status: 404,
        });
      }

      const price = product.price;

      if (vendor.quantity <= 0) {
        throw new BadRequestException({
          message: `Invalid quantity for ${product.name}.`,
          status: 400,
          success: false,
        });
      }

      if (product.stock < vendor.quantity) {
        throw new BadRequestException({
          message: `This store has ${product.stock} ${product.name} is left.`,
          success: false,
          status: 400,
        });
      }

      const itemTotal = price * vendor.quantity;

      vendorSubtotal += itemTotal;

      processedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: price,
        quantity: vendor.quantity,
      });

      const businessMap = new Map(businesses.map((b) => [b._id.toString(), b]));

      globalSubtotal += vendorSubtotal;

      const business = businessMap.get(vendor.businessId);

      if (!business) {
        throw new NotFoundException({
          message: 'Business not found.',
          status: 404,
          success: false,
        });
      }

      if (!business?.businessAddress) {
        throw new NotFoundException({
          message: `Business address not found for business with ID ${business._id.toString()} and business name: ${business.businessName}.`,
          status: 404,
          success: false,
        });
      }

      processedVendorOrders.push({
        businessId: vendor.businessId,
        businessAddress: business.businessAddress,
        items: processedItems,
        subtotal: vendorSubtotal,
        status: VendorOrderStatus.pending,
      });
    }

    // 4. FINAL TOTAL
    const total = globalSubtotal + deliveryFee;

    const payload = {
      cartId,
      customerId,
      items: processedVendorOrders,
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

  async markBusinessItemInAnOrderAsPacked(
    user: JwtUser,
    orderId: string,
    businessId: string,
    productId: string,
  ) {
    const order = await this.orderRepository.findOrderByOrderId(orderId);

    if (!order) {
      throw new NotFoundException({
        message: 'Order not found.',
        status: 404,
        success: false,
      });
    }

    const businessOrder = order.vendorOrders.find(
      (b) => b.businessId.toString() === businessId,
    );

    if (!businessOrder) {
      throw new NotFoundException({
        message: 'Business order not found.',
        success: false,
        status: 404,
      });
    }

    const item = businessOrder.items.find(
      (i) => i.productId.toString() === productId,
    );

    if (!item) {
      throw new NotFoundException({
        message: `Product with ID: ${productId} not found.`,
        success: false,
        status: 404,
      });
    }

    item.itemStatus = VendorItemOrderStatus.ready;

    const allPacked = businessOrder.items.every(
      (i) => i.itemStatus === VendorItemOrderStatus.ready,
    );

    if (allPacked) {
      businessOrder.status = VendorOrderStatus.ready;
    }

    const allBusinessesOrderPacked = order.vendorOrders.every(
      (biz) => biz.status === VendorOrderStatus.ready,
    );

    if (allBusinessesOrderPacked) {
      order.status = OrderStatus.ready_for_delivery;

      const payload = {
        orderId: order._id,
        deliveryMode: order.deliveryMode,
        dropoffAddress:
          order.deliveryMode === DeliveryMode.homeDelivery
            ? order.deliveryAddress
            : undefined,
        pickupPoints: order.vendorOrders.map((v) => ({
          businessId: v.businessId.toString(),
          address: v.businessAddress,
          isPickedUp: false,
        })),

        status: DeliveryStatus.available,
      };
      const delivery =
        await this.deliveryRepository.createDeliveryFromOrder(payload);

      if (!delivery) {
        throw new BadRequestException({
          message: 'Unable to create delivery document for this order.',
          success: false,
          status: 400,
        });
      }

      const marketplaceEntry =
        await this.deliveryMarketplaceRepository.publishDelivery(delivery._id);

      const notifyRiders =
        await this.notificationsService.notifyRidersNearby(order);

      const updateOrderStatus = await this.orderRepository.updateOrderStatus(
        order._id.toString(),
        OrderStatus.in_delivery,
      );
    }

    await order.save();

    return {
      message: 'Order marked successfull',
    };
  }
}
