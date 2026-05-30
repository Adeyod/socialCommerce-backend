import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessShippingRateService } from '../business-shipping-rate/business-shipping-rate.service';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CartRepository } from '../carts/repositories/cart.repository';
import { CollectionFeeRepository } from '../collection/repositories/collection-fee.repository';
import { DeliveryMarketplaceRepository } from '../delivery-marketplace/repositories/delivery-marketplace.repository';
import { DeliveryRepository } from '../delivery/repositories/delivery.repository';
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
  ShipmentStatus,
  VendorItemOrderStatus,
  VendorOrderStatus,
} from './schemas/order.schema';
import { VendorObject } from './types/processed-vendor.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly deliveryRepository: DeliveryRepository,
    private readonly deliveryMarketplaceRepository: DeliveryMarketplaceRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly paymentsService: PaymentsService,
    private readonly businessShippingRateService: BusinessShippingRateService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly collectionFeeRepository: CollectionFeeRepository,
  ) {}

  // async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
  //   const {
  //     customerId,
  //     items,
  //     deliveryFee,
  //     deliveryAddress,
  //     contactPhone,
  //     idempotencyKey,
  //     cartId,
  //     deliveryMode,
  //     pickupCenter,
  //   } = createOrderDto;

  //   // 1. AUTH CHECK
  //   if (user.sub.toString() !== customerId) {
  //     throw new BadRequestException({
  //       message: 'Invalid user mismatch',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   if (
  //     deliveryMode === DeliveryMode.pickUpFromOurNearestOffice &&
  //     !pickupCenter
  //   ) {
  //     throw new BadRequestException({
  //       message: 'Pickup center is required.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const buyerState = deliveryAddress.state.toLowerCase();

  //   if (!buyerState) {
  //     throw new BadRequestException({
  //       message: 'Buyer state is required',
  //     });
  //   }

  //   const existingOrder = await this.orderRepository.findOrderByIdempotencyKey(
  //     idempotencyKey,
  //     user.sub.toString(),
  //   );

  //   if (existingOrder) {
  //     const paymentMade = await this.paymentsRepository.findPaymentByOrderId(
  //       existingOrder._id.toString(),
  //     );

  //     if (!paymentMade) {
  //       const newPayment = await this.paymentsService.createPaymentIntent(
  //         PaymentProvider.PAYSTACK,
  //         user,
  //         existingOrder._id.toString(),
  //         existingOrder.total,
  //       );

  //       return {
  //         order: existingOrder,
  //         payment: newPayment,
  //       };
  //     }

  //     if (
  //       existingOrder.isPaid &&
  //       paymentMade.verified === true &&
  //       paymentMade.status === PaymentStatus.successful
  //     ) {
  //       return {
  //         order: existingOrder,
  //         payment: null,
  //         message: 'Order already paid',
  //       };
  //     } else {
  //       const now = new Date();
  //       if (paymentMade?.expiresAt && paymentMade.expiresAt < now) {
  //         await this.paymentsRepository.updatePaymentExpirationUsingPaymentId(
  //           paymentMade._id,
  //         );

  //         const newPayment = await this.paymentsService.createPaymentIntent(
  //           PaymentProvider.PAYSTACK,
  //           user,
  //           existingOrder._id.toString(),
  //           existingOrder.total,
  //         );

  //         return {
  //           order: existingOrder,
  //           payment: newPayment,
  //         };
  //       }
  //     }
  //   }

  //   const cartExist = await this.cartRepository.getCartByCartIdAndUserId(
  //     cartId,
  //     user.sub.toString(),
  //   );

  //   if (!cartExist) {
  //     throw new NotFoundException({
  //       message: 'Cart not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   if (!items?.length) {
  //     throw new BadRequestException({
  //       message: 'Cart is empty',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const cartItemsMap = new Map(
  //     cartExist.items.map((item) => [
  //       item.productId.toString(),
  //       {
  //         quantity: item.quantity,
  //         businessId: item.businessId.toString(),
  //       },
  //     ]),
  //   );

  //   for (const item of items) {
  //     const cartItem = cartItemsMap.get(item.productId.toString());

  //     if (!cartItem) {
  //       throw new BadRequestException({
  //         message: `Product ${item.productId} not found in cart`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     if (cartItem.quantity !== item.quantity) {
  //       throw new BadRequestException({
  //         message: `Quantity mismatch for product ${item.productId}`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     if (cartItem.businessId !== item.businessId.toString()) {
  //       throw new BadRequestException({
  //         message: `Business mismatch for product ${item.productId}`,
  //         success: false,
  //         status: 400,
  //       });
  //     }
  //   }

  //   // Optional: Ensure no extra items are missing
  //   if (items.length !== cartExist.items.length) {
  //     throw new BadRequestException({
  //       message: 'Cart items mismatch',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const businessIds = items.map((v) => v.businessId);

  //   const businesses =
  //     await this.businessesRepository.findBusinessesByIds(businessIds);

  //   const businessMap = new Map(businesses.map((b) => [b._id.toString(), b]));

  //   let globalSubtotal = 0;
  //   let productSurchargeTotal = 0;
  //   const interStateGroups = new Set<string>();

  //   // GROUP BY VENDOR
  //   const vendorMap = new Map<string, any>();

  //   // 2. PROCESS EACH VENDOR
  //   for (const item of items) {
  //     const product = await this.productsRepository.findById(item.productId);

  //     if (!product) {
  //       throw new NotFoundException({
  //         message: `Product not found: ${item.productId}`,
  //         success: false,
  //         status: 404,
  //       });
  //     }

  //     if (!product.inStock) {
  //       throw new NotFoundException({
  //         message: `Product ${product.name} is out of stock`,
  //         success: false,
  //         status: 404,
  //       });
  //     }

  //     const price = product.price;

  //     if (item.quantity <= 0) {
  //       throw new BadRequestException({
  //         message: `Invalid quantity for ${product.name}.`,
  //         status: 400,
  //         success: false,
  //       });
  //     }

  //     if (product.stock < item.quantity) {
  //       throw new BadRequestException({
  //         message: `This store has ${product.stock} ${product.name} is left.`,
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const business = businessMap.get(item.businessId);

  //     if (!business) {
  //       throw new NotFoundException({
  //         message: 'Business not found.',
  //         status: 404,
  //         success: false,
  //       });
  //     }

  //     if (!business?.businessAddress?.state) {
  //       throw new NotFoundException({
  //         message: `Business address not found for business with ID ${business._id.toString()} and business name: ${business.businessName}.`,
  //         status: 404,
  //         success: false,
  //       });
  //     }

  //     const productState = business.businessAddress.state.toLowerCase();
  //     // const isInterState = productState !== buyerState;

  //     let itemTotal = product.price * item.quantity;

  //     globalSubtotal += itemTotal;

  //     if (!vendorMap.has(item.businessId)) {
  //       vendorMap.set(item.businessId, {
  //         businessId: item.businessId,
  //         items: [],
  //         subtotal: 0,
  //         totalWeight: 0,
  //         state: productState,
  //         status: VendorOrderStatus.pending,
  //       });
  //     }

  //     const vendorGroup = vendorMap.get(item.businessId);

  //     vendorGroup.items.push({
  //       productId: product._id,
  //       name: product.name,
  //       price: product.price,
  //       quantity: item.quantity,
  //       itemStatus: VendorItemOrderStatus.pending,
  //     });

  //     vendorGroup.subtotal += itemTotal;
  //   }

  //   // 6. COLLECTION FEE
  //   const uniqueStates = Array.from(interStateGroups);

  //   let collectionFee = 0;

  //   if (uniqueStates.length > 0) {
  //     const feeConfig =
  //       await this.collectionFeeRepository.findCollectionFeeByState(buyerState);

  //     if (!feeConfig) {
  //       throw new NotFoundException(`Collection fee not set for ${buyerState}`);
  //     }

  //     collectionFee =
  //       feeConfig.baseFee + feeConfig.additionalFee * (uniqueStates.length - 1);
  //   }

  //   // 7. LAST-MILE DELIVERY
  //   let lastMileFee = 0;

  //   if (deliveryMode === DeliveryMode.homeDelivery) {
  //     // Replace with your real logic
  //     lastMileFee = 1000;
  //   }

  //   // 8. FINAL TOTAL
  //   const total =
  //     globalSubtotal + productSurchargeTotal + collectionFee + lastMileFee;

  //   const vendors: VendorObject[] = Array.from(vendorMap.values());

  //   // 9. SHIPMENT
  //   const shipment = {
  //     shipmentId: crypto.randomUUID(),
  //     originPickupCenter: process.env.EKITI_PICKUP_CENTER_ID || '',
  //     destinationPickupCenter:
  //       deliveryMode === DeliveryMode.pickUpFromOurNearestOffice
  //         ? pickupCenter
  //         : undefined,
  //     deliveryMode,
  //     vendors,
  //     subtotal: globalSubtotal,
  //     status: ShipmentStatus.pending,
  //   };

  //   // 10. ORDER PAYLOAD
  //   const payload = {
  //     cartId,
  //     customerId,
  //     shipments: [shipment],

  //     subtotal: globalSubtotal,
  //     productSurchargeTotal,
  //     collectionFee,
  //     deliveryFee: lastMileFee,

  //     total,

  //     deliveryMode,
  //     deliveryAddress,
  //     destinationPickupCenter: pickupCenter,

  //     contactPhone,
  //     isPaid: false,
  //     status: OrderStatus.pending,
  //     idempotencyKey,
  //   };

  //   // 11. CREATE ORDER
  //   const order = await this.orderRepository.createOrder(payload);

  //   if (!order) {
  //     throw new BadRequestException('Order creation failed');
  //   }

  //   // 12. PAYMENT
  //   const paymentIntent = await this.paymentsService.createPaymentIntent(
  //     PaymentProvider.PAYSTACK,
  //     user,
  //     order._id.toString(),
  //     total,
  //   );

  //   return {
  //     order,
  //     paymentIntent,
  //   };
  // }

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

    // AUTH CHECK
    if (user.sub.toString() !== customerId) {
      throw new BadRequestException({
        message: 'Invalid user mismatch',
        success: false,
        status: 400,
      });
    }

    if (
      deliveryMode === DeliveryMode.pickUpFromOurNearestOffice &&
      !pickupCenter
    ) {
      throw new BadRequestException({
        message: 'Pickup center is required.',
        success: false,
        status: 400,
      });
    }

    const buyerState = deliveryAddress.state?.toLowerCase();

    if (!buyerState) {
      throw new BadRequestException({
        message: 'Buyer state is required',
      });
    }

    // IDEMPOTENCY CHECK
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

        return { order: existingOrder, payment: newPayment };
      }

      if (
        existingOrder.isPaid &&
        paymentMade.verified &&
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

          return { order: existingOrder, payment: newPayment };
        }
      }
    }

    // VALIDATE CART
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

    if (!items?.length) {
      throw new BadRequestException({
        message: 'Cart is empty',
        success: false,
        status: 400,
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

    if (items.length !== cartExist.items.length) {
      throw new BadRequestException({
        message: 'Cart items mismatch',
        success: false,
        status: 400,
      });
    }

    // FETCH BUSINESSES
    const businessIds = items.map((v) => v.businessId);
    const businesses =
      await this.businessesRepository.findBusinessesByIds(businessIds);

    const businessMap = new Map(businesses.map((b) => [b._id.toString(), b]));

    let globalSubtotal = 0;
    let productSurchargeTotal = 0;
    const interStateGroups = new Set<string>();

    const vendorMap = new Map<string, any>();

    // PROCESS ITEMS (NO SHIPPING HERE)
    for (const item of items) {
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
          message: `Product ${product.name} is out of stock`,
          success: false,
          status: 404,
        });
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException({
          message: `Only ${product.stock} ${product.name} left.`,
          success: false,
          status: 400,
        });
      }

      const business = businessMap.get(item.businessId);

      if (!business?.businessAddress?.state) {
        throw new NotFoundException({
          message: `Business address not found.`,
          status: 404,
          success: false,
        });
      }

      const productState = business.businessAddress.state.toLowerCase();

      const itemTotal = product.price * item.quantity;

      if (!vendorMap.has(item.businessId)) {
        vendorMap.set(item.businessId, {
          businessId: item.businessId,
          items: [],
          subtotal: 0,
          totalWeight: 0,
          state: productState,
          status: VendorOrderStatus.pending,
        });
      }

      const vendorGroup = vendorMap.get(item.businessId);

      vendorGroup.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        itemStatus: VendorItemOrderStatus.pending,
      });

      vendorGroup.subtotal += itemTotal;

      // AGGREGATE WEIGHT
      vendorGroup.totalWeight += product?.weight * item.quantity;

      globalSubtotal += itemTotal;
    }

    // SHIPPING (PER VENDOR)
    for (const vendor of vendorMap.values()) {
      const isInterState = vendor.state !== buyerState;

      if (isInterState) {
        const shippingFee =
          await this.businessShippingRateService.getBusinessShippingPricePerState(
            vendor.businessId.toString(),
            buyerState,
            vendor.totalWeight,
          );

        if (!shippingFee) {
          throw new NotFoundException(
            `Shipping fee not configured for business ${vendor.businessId}`,
          );
        }

        vendor.subtotal += shippingFee;
        productSurchargeTotal += shippingFee;

        interStateGroups.add(vendor.state);
      }
    }

    // COLLECTION FEE
    let collectionFee = 0;

    if (interStateGroups.size > 0) {
      const feeConfig =
        await this.collectionFeeRepository.findCollectionFeeByState(buyerState);

      if (!feeConfig) {
        throw new NotFoundException(`Collection fee not set for ${buyerState}`);
      }

      collectionFee =
        feeConfig.baseFee +
        feeConfig.additionalFee * (interStateGroups.size - 1);
    }

    // LAST-MILE DELIVERY
    let lastMileFee = 0;

    if (deliveryMode === DeliveryMode.homeDelivery) {
      /**
       Get the last mile delivery here.
       get the address of the buyer.
       get the nearest bus stop that the buyer selected here
       use nearest bus stop to get the price of the platform for the bus stop
       *  */

      //  de
      lastMileFee = 1000;
    }

    // TOTAL
    const total =
      globalSubtotal + productSurchargeTotal + collectionFee + lastMileFee;

    const vendors: VendorObject[] = Array.from(vendorMap.values());

    // SHIPMENT
    const shipment = {
      shipmentId: crypto.randomUUID(),
      originPickupCenter: process.env.EKITI_PICKUP_CENTER_ID || '',
      destinationPickupCenter:
        deliveryMode === DeliveryMode.pickUpFromOurNearestOffice
          ? pickupCenter
          : undefined,
      deliveryMode,
      vendors,
      subtotal: globalSubtotal,
      status: ShipmentStatus.pending,
    };

    // ORDER PAYLOAD
    const payload = {
      cartId,
      customerId,
      shipments: [shipment],
      subtotal: globalSubtotal,
      productSurchargeTotal,
      collectionFee,
      deliveryFee: lastMileFee,
      total,
      deliveryMode,
      deliveryAddress,
      destinationPickupCenter: pickupCenter,
      contactPhone,
      isPaid: false,
      status: OrderStatus.pending,
      idempotencyKey,
    };

    // CREATE ORDER
    const order = await this.orderRepository.createOrder(payload);

    if (!order) {
      throw new BadRequestException('Order creation failed');
    }

    // PAYMENT
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      PaymentProvider.PAYSTACK,
      user,
      order._id.toString(),
      total,
    );

    return {
      order,
      paymentIntent,
    };
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

  async markBusinessItemInAnOrderAsDeliveredToPickupCenter(
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

    const shipment = order.shipments.find((s) =>
      s.vendors.some((v) => v.businessId.toString() === businessId),
    );

    if (!shipment) {
      throw new NotFoundException({
        message: 'Shipment containing this vendor not found.',
        status: 404,
        success: false,
      });
    }

    const vendor = shipment.vendors.find(
      (v) => v.businessId.toString() === businessId,
    );

    if (!vendor) {
      throw new NotFoundException({
        message: 'Vendor not found in shipment.',
        status: 404,
        success: false,
      });
    }

    // STEP 3: FIND PRODUCT ITEM
    const item = vendor.items.find((i) => i.productId.toString() === productId);

    if (!item) {
      throw new NotFoundException({
        message: `Product ${productId} not found in vendor order.`,
        status: 404,
        success: false,
      });
    }

    // STEP 4: UPDATE ITEM STATUS
    item.itemStatus = VendorItemOrderStatus.delivered_to_pickup_center;

    // STEP 5: CHECK IF ALL ITEMS IN VENDOR ARE DONE
    const allVendorItemsDone = vendor.items.every(
      (i) => i.itemStatus === VendorItemOrderStatus.delivered_to_pickup_center,
    );

    if (allVendorItemsDone) {
      vendor.status = VendorOrderStatus.delivered_to_pickup_center;
    }

    // STEP 6: CHECK IF ALL VENDORS IN THIS SHIPMENT ARE READY
    const allVendorsDone = shipment.vendors.every(
      (v) => v.status === VendorOrderStatus.delivered_to_pickup_center,
    );

    if (allVendorsDone) {
      shipment.status = ShipmentStatus.collecting;

      // optional: update order-level status
      order.status = OrderStatus.processing;
    }

    await order.save();

    return {
      message: 'Item marked as delivered to pickup center successfully',
    };

    /**
 *
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
  order.status = OrderStatus.processing;

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
    OrderStatus.in_transit,
  );
}

await order.save();

return {
  message: 'Order marked successfull',
};
 */
  }

  /*
  FOR CALCULATING park collection fee
  const baseFee = 500;
const additionalFee = 200;

// VERY IMPORTANT
const uniqueParks = getUniqueArrivalParks(order);

const collectionFee =
  uniqueParks.length === 0
    ? 0
    : baseFee + (uniqueParks.length - 1) * additionalFee;
    */
}
