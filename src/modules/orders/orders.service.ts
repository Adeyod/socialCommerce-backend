import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { ShipmentEvents } from '../../common/events/order.events';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessShippingRateService } from '../business-shipping-rate/business-shipping-rate.service';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CartRepository } from '../carts/repositories/cart.repository';
import { CollectionFeeRepository } from '../collection/repositories/collection-fee.repository';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { HomeDeliveryService } from '../home-delivery/home-delivery.service';
import { InventoryRepository } from '../inventory/repositories/inventory.repository';
import { PaymentsService } from '../payments/payments.service';
import { PaymentProvider } from '../payments/schemas/payment.schema';
import { PaymentBreakdown } from '../payments/types/payment-breakdown.type';
import { PickupCenterService } from '../pickup-center/pickup-center.service';
import { ProductsRepository } from '../products/repositories/product.repository';
import { Role } from '../users/schemas/user.schema';
import { SendItemsToPickupDto } from '../vendor/dtos/bulk-send-to-pickup.dto';
import { CreateOrderDto } from './dtos/create-order.dto';
import { MarkItemReceivedDto } from './dtos/mark-item-received.dto';
import { OrderRepository } from './repositories/order.repository';
import { VendorItemOrderStatus } from './schemas/item-vendor-order.schema';
import {
  DeliveryMode,
  OrderStatus,
  ShipmentStatus,
} from './schemas/order.schema';
import { VendorOrderStatus } from './schemas/vendor-order.schema';
import { VendorGroup } from './types/vendor.types';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly eventEmitter: EventEmitter2,

    private readonly productsRepository: ProductsRepository,
    private readonly businessShippingRateService: BusinessShippingRateService,
    private readonly businessesRepository: BusinessesRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly collectionFeeRepository: CollectionFeeRepository,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => HomeDeliveryService))
    private readonly homeDeliveryService: HomeDeliveryService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => PickupCenterService))
    private readonly pickupCenterService: PickupCenterService,
  ) {}

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

    const response =
      await this.orderRepository.findOrderByOrderIdWithoutSession(orderId);

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

  async getVendorSingleOrderByBusinessIdAndOrderId(
    businessId: string,
    orderId: string,
    user: JwtUser,
  ) {
    const response =
      await this.orderRepository.getVendorSingleOrderByBusinessIdAndOrderId(
        orderId,
        businessId,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Order not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async markBusinessItemInAnOrderAsDeliveredToPickupCenter(
    user: JwtUser,
    orderId: string,
    businessId: string,
    productId: string,
  ) {
    const order =
      await this.orderRepository.findOrderByOrderIdWithoutSession(orderId);

    if (!order) {
      throw new NotFoundException({
        message: 'Order not found.',
        status: 404,
        success: false,
      });
    }

    const shipment = order.shipment;

    if (!shipment) {
      throw new NotFoundException({
        message: 'Shipment containing this vendor not found.',
        status: 404,
        success: false,
      });
    }

    const vendorExists = shipment.vendors.some(
      (v) => v.businessId.toString() === businessId,
    );

    if (!vendorExists) {
      throw new NotFoundException({
        message: 'Shipment does not contain this vendor.',
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
    item.itemStatus = VendorItemOrderStatus.sent_to_pickup_center;

    // STEP 5: CHECK IF ALL ITEMS IN VENDOR ARE DONE
    const allVendorItemsDone = vendor.items.every(
      (i) => i.itemStatus === VendorItemOrderStatus.sent_to_pickup_center,
    );

    if (allVendorItemsDone) {
      vendor.status = VendorOrderStatus.sent_to_pickup_center;
    }

    // STEP 6: CHECK IF ALL VENDORS IN THIS SHIPMENT ARE READY
    const allVendorsDone = shipment.vendors.every(
      (v) => v.status === VendorOrderStatus.sent_to_pickup_center,
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
  }

  async getPendingPickupCenterItems(
    pickupCenterId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.orderRepository.getPendingPickupCenterItems(
      pickupCenterId,
      queryWithPaginationDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'No orders found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async markItemAsReceivedAtPickupCenter(
    dto: MarkItemReceivedDto,
    pickupCenterId: string,
  ) {
    const { orderId, vendorOrderId, itemVendorOrderId, businessId } = dto;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // =========================
      // 1. UPDATE ITEM (SOURCE OF TRUTH)
      // =========================
      const itemUpdateResult =
        await this.orderRepository.updateOneItemVendorOrderStatus(
          dto,
          VendorItemOrderStatus.received_at_pickup_center,
          session,
        );

      if (itemUpdateResult.modifiedCount === 0) {
        throw new BadRequestException('Item not found or already processed');
      }

      // =========================
      // 2. CHECK IF VENDOR ORDER IS COMPLETE
      // =========================
      const pendingVendorItems =
        await this.orderRepository.countItemVendorOrderDocumentNotYetAtPickupCenter(
          vendorOrderId,
          session,
        );

      const vendorComplete = pendingVendorItems === 0;

      if (vendorComplete) {
        await this.orderRepository.updateOneVendorOrderStatus(
          vendorOrderId,
          businessId,
          VendorOrderStatus.received_at_pickup_center,
          session,
        );
      }

      // =========================
      // 3. CHECK IF FULL ORDER IS COMPLETE
      // =========================
      const pendingOrderItems =
        await this.orderRepository.countAllItemsNotYetAtPickupCenterInAnOrderDocument(
          orderId,
          VendorItemOrderStatus.received_at_pickup_center,
          session,
        );

      const orderComplete = pendingOrderItems === 0;

      if (orderComplete) {
        await this.orderRepository.updateOrderStatusWithSession(
          orderId,
          OrderStatus.completed_at_pickup_center,
          session,
        );
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        vendorComplete,
        orderComplete,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const response = await this.orderRepository.updateOrderStatus(
      orderId,
      status,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'No order found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async findOrderByOrderIdWithoutSession(orderId: string) {
    const response =
      await this.orderRepository.findOrderByOrderIdWithoutSession(orderId);

    if (!response) {
      throw new NotFoundException({
        message: 'No order found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async getOrdersForPickupCenter(
    pickupCenterId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.orderRepository.getOrdersForPickupCenter(
      pickupCenterId,
      queryWithPaginationDto,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'No orders found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async findOrderByOrderId(orderId: string, session: ClientSession) {
    const response = await this.orderRepository.findOrderByOrderId(
      orderId,
      session,
    );

    if (!response) {
      throw new NotFoundException({
        message: 'Order not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
    const {
      customerId,
      vendorOrders,
      deliveryAddress,
      contactPhone,
      idempotencyKey,
      cartId,
      deliveryMode,
      deliveryFee,
      pickupCenter,
      nearestBusStop,
      subTotalSummation,
      shippingFeeSummation,
      interStatePickupFee,
    } = createOrderDto;

    console.log('incoming service createOrderDto:', createOrderDto);

    if (user.sub.toString() !== customerId) {
      throw new BadRequestException('Invalid user mismatch');
    }

    let buyerState: NigeriaState;

    if (deliveryMode === DeliveryMode.homeDelivery) {
      if (!deliveryAddress) {
        throw new BadRequestException(
          'deliveryAddress is required for home delivery',
        );
      }

      buyerState = deliveryAddress.state;
    } else {
      if (!pickupCenter) {
        throw new BadRequestException(
          'pickupCenter is required for pickup delivery',
        );
      }

      const pickupCenterData =
        await this.pickupCenterService.getPickupCenterById(pickupCenter);

      buyerState = pickupCenterData.state;
    }

    // CART
    const cartExist = await this.cartRepository.getCartByCartIdAndUserId(
      cartId,
      user.sub.toString(),
    );

    if (!cartExist) throw new NotFoundException('Cart not found');

    // FLATTEN
    const flatItems = vendorOrders.flatMap((v) =>
      v.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        businessId: v.businessId,
      })),
    );

    // =========================
    // 🔥 SINGLE PRODUCT QUERY
    // =========================
    const productIds = flatItems.map((i) => i.productId);

    const products = await this.productsRepository.findByIds(productIds);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // BUSINESSES
    const businessIds = vendorOrders.map((v) => v.businessId);

    const businesses =
      await this.businessesRepository.findBusinessesByIds(businessIds);

    const businessMap = new Map(businesses.map((b) => [b._id.toString(), b]));

    let globalSubtotal = 0;
    let globalTotalWeight = 0;
    let shippingFeeTotal = 0;
    let collectionFee = 0;
    const interStateGroups = new Set<string>();

    const vendorMap = new Map<string, any>();

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      for (const vendor of vendorOrders) {
        if (!vendor.items || vendor.items.length === 0) {
          throw new BadRequestException(
            `Vendor ${vendor.businessId} has no items in order`,
          );
        }
        const business = businessMap.get(vendor.businessId);

        if (!business) {
          throw new NotFoundException({
            message: `Business with ID ${vendor.businessId} not found.`,
            success: false,
            status: 404,
          });
        }

        const businessState = business?.businessAddress?.state;

        if (!businessState) {
          throw new BadRequestException(
            `Business ${business._id.toString()} has no state configured`,
          );
        }

        console.log('businessState:', businessState);

        const vendorGroup: VendorGroup = {
          businessId: vendor.businessId,
          items: [],
          subtotal: 0,
          totalWeight: 0,
          shippingFee: 0,
          originState: businessState.toLowerCase(),
        };

        for (const item of vendor.items) {
          const product = productMap.get(item.productId.toString());
          console.log('product:', product);

          if (!product) {
            throw new NotFoundException(`Product not found: ${item.productId}`);
          }

          const availableStock = product.stock - product.reservedQuantity;
          console.log('availableStock:', availableStock);
          console.log('item.quantity:', item.quantity);

          if (availableStock < item.quantity) {
            throw new BadRequestException(
              `Only ${availableStock} ${product.name} left`,
            );
          }

          const reserved = await this.productsRepository.reserveStock(
            item.productId,
            item.quantity,
            session,
          );

          const inventoryReserve = await this.inventoryRepository.reserveStock(
            item.productId,
            item.quantity,
            session,
          );

          const itemTotal = product.price * item.quantity;
          const itemWeight = product.weight * item.quantity;

          vendorGroup.items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
          });

          vendorGroup.subtotal += itemTotal;
          vendorGroup.totalWeight += itemWeight;

          globalSubtotal += itemTotal;
          globalTotalWeight += itemWeight;
        }

        // SHIPPING
        const isInterState =
          vendorGroup.originState !== buyerState.toLowerCase();

        console.log('isInterState:', isInterState);
        const shippingFee =
          await this.businessShippingRateService.getBusinessShippingPricePerState(
            vendor.businessId,
            buyerState,
            vendorGroup.totalWeight,
          );

        console.log('shippingFee:', shippingFee);
        vendorGroup.shippingFee = shippingFee;
        shippingFeeTotal += shippingFee;
        if (isInterState) {
          interStateGroups.add(vendorGroup.originState);
        }

        vendorMap.set(vendor.businessId, vendorGroup);
      }
      console.log('globalSubtotal:', globalSubtotal);
      console.log('subTotalSummation:', subTotalSummation);

      // VALIDATE FRONTEND TOTALS
      if (subTotalSummation && subTotalSummation !== globalSubtotal) {
        throw new BadRequestException('Subtotal mismatch');
      }

      console.log('shippingFeeTotal:', shippingFeeTotal);
      console.log('shippingFeeSummation:', shippingFeeSummation);

      if (shippingFeeSummation && shippingFeeSummation !== shippingFeeTotal) {
        throw new BadRequestException('Shipping mismatch');
      }
      console.log('pass 2');

      // COLLECTION FEE
      if (interStateGroups.size > 0) {
        const feeConfig =
          await this.collectionFeeRepository.findCollectionFeeByState(
            buyerState,
          );

        if (!feeConfig) {
          throw new NotFoundException({
            message: 'No collection fee found for this state.',
            success: false,
            status: 404,
          });
        }

        collectionFee =
          feeConfig.baseFee +
          feeConfig.additionalFee * (interStateGroups.size - 1);

        if (!interStatePickupFee || interStatePickupFee === 0) {
          throw new BadRequestException({
            message: 'State logistic fee is required.',
            success: false,
            status: 400,
          });
        }

        if (collectionFee !== interStatePickupFee) {
          throw new BadRequestException({
            message: 'State logistic fee mis-match',
            success: false,
            status: 400,
          });
        }
      }

      // LAST MILE
      let lastMileFee = 0;

      if (deliveryMode === DeliveryMode.homeDelivery) {
        if (!nearestBusStop) {
          throw new BadRequestException({
            message: 'Nearest bus stop is required.',
            success: false,
            status: 400,
          });
        }

        lastMileFee =
          await this.homeDeliveryService.findHomeDeliveryFeeUsingWeightStateAndNearestBusStop(
            buyerState,
            nearestBusStop,
            globalTotalWeight,
          );
        console.log('lastMileFee:', lastMileFee);

        if (!deliveryFee || deliveryFee === 0) {
          throw new BadRequestException({
            message: 'Delivery fee is required.',
            success: false,
            status: 400,
          });
        }

        if (lastMileFee !== deliveryFee) {
          throw new BadRequestException({
            message: 'Home delivery fee mis-match',
            success: false,
            status: 400,
          });
        }
      }

      const total =
        globalSubtotal + shippingFeeTotal + collectionFee + lastMileFee;
      console.log('total:', total);

      const vendors = Array.from(vendorMap.values());

      // =========================
      // 💰 PAYMENT BREAKDOWN
      // =========================
      const paymentBreakdown: PaymentBreakdown = {
        vendors: vendors.map((v) => ({
          businessId: v.businessId,
          productTotal: v.subtotal,
          shippingFee: v.shippingFee,
          total: v.subtotal + v.shippingFee,
        })),
        platformFees: {
          collectionFee,
          deliveryFee: lastMileFee,
        },
        deliveryMode,
        deliveryAddress:
          deliveryMode === DeliveryMode.homeDelivery && deliveryAddress
            ? deliveryAddress
            : null,
        pickupCenter:
          deliveryMode === DeliveryMode.pickUpFromOurNearestOffice &&
          pickupCenter
            ? pickupCenter
            : null,
      };
      console.log('paymentBreakdown:', paymentBreakdown);

      let resolvedPickupCenter: string;

      if (deliveryMode === DeliveryMode.pickUpFromOurNearestOffice) {
        if (!pickupCenter) {
          throw new BadRequestException('pickupCenter is required');
        }

        resolvedPickupCenter = pickupCenter;
      } else {
        resolvedPickupCenter = 'No pickup center';
      }

      console.log('deliveryMode:', deliveryMode);

      const order = await this.orderRepository.createOrder(
        {
          cartId,
          customerId,
          subtotal: globalSubtotal,
          shippingFeeTotal,
          collectionFee,
          deliveryFee: lastMileFee,
          total,
          deliveryAddress:
            deliveryMode === DeliveryMode.homeDelivery
              ? deliveryAddress
              : undefined,
          destinationPickupCenter:
            deliveryMode === DeliveryMode.pickUpFromOurNearestOffice
              ? pickupCenter
              : null,
          contactPhone,
          isPaid: false,
          deliveryMode,
          status: OrderStatus.pending,
          idempotencyKey,
        },
        session,
      );

      if (!order) {
        throw new BadRequestException({
          message: 'Unable to create order.',
          success: false,
          status: 400,
        });
      }

      // =========================
      // ✅ CREATE VENDOR ORDERS
      // =========================
      const vendorOrderDocs: any[] = [];

      for (const vendor of vendors) {
        const vendorOrder = await this.orderRepository.createVendorOrder(
          {
            orderId: order._id,
            businessId: vendor.businessId,
            subtotal: vendor.subtotal,
            status: VendorOrderStatus.pending,
          },
          session,
        );

        vendorOrderDocs.push({
          vendorOrder,
          items: vendor.items,
          businessId: vendor.businessId,
        });
      }

      // =========================
      // ✅ CREATE ITEM ORDERS
      // =========================
      for (const vendor of vendorOrderDocs) {
        const itemDocs = vendor.items.map((item) => ({
          orderId: order._id,
          vendorOrderId: vendor.vendorOrder._id,
          businessId: vendor.businessId,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          status: VendorItemOrderStatus.pending,
        }));

        await this.orderRepository.createItemVendorOrders(itemDocs, session);
      }

      // =========================
      // SEND METADATA TO PAYSTACK
      // =========================
      const paymentIntent = await this.paymentsService.createPaymentIntent(
        PaymentProvider.PAYSTACK,
        user,
        order._id.toString(),
        total,
        paymentBreakdown,
      );

      await session.commitTransaction();
      session.endSession();

      return {
        order,
        paymentIntent,
        breakdown: paymentBreakdown,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getVendorBusinessSingleOrderDetailsForFulfilment(
    businessId: string,
    orderId: string,
    user: JwtUser,
  ) {
    const buzId = new Types.ObjectId(businessId);
    const order = new Types.ObjectId(orderId);

    const response =
      await this.orderRepository.getVendorBusinessSingleOrderDetailsForFulfilment(
        buzId,
        order,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'Vendor order details not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async sendSingleOrderToPickup(
    businessId: string,
    itemId: string,
    pickupCenterId: string,
    user: JwtUser,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const bizId = new Types.ObjectId(businessId);
      const itemObjectId = new Types.ObjectId(itemId);

      // 1. Update item
      const item = await this.orderRepository.markSingleItemAsSentToPickup(
        bizId,
        itemObjectId,
        session,
      );

      if (!item) {
        throw new BadRequestException('Item already processed or not found');
      }

      const { vendorOrderId, orderId } = item;

      // 2. Recompute vendor order state
      const vendorOrderUpdated =
        await this.orderRepository.syncVendorOrderAfterItemUpdate(
          vendorOrderId,
          bizId,
          session,
        );

      // 3. Recompute order state
      await this.orderRepository.syncOrderAfterVendorUpdate(orderId, session);

      await session.commitTransaction();
      session.endSession();

      // 4. Event emission AFTER commit
      this.eventEmitter.emit(ShipmentEvents.item_sent_to_pickup_center, {
        itemVendorOrderId: itemId,
        vendorOrderId: vendorOrderId.toString(),
        orderId: orderId.toString(),
        pickupCenterId,
        vendorBusinessId: businessId,
        triggeredBy: user.sub.toString(),
        vendorOrderCompleted: vendorOrderUpdated,
      });

      return {
        success: true,
        vendorOrderUpdated,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async sendMultipleOrderToPickup(
    payload: SendItemsToPickupDto[],
    businessId: string,
    pickupCenterId: string,
    user: JwtUser,
  ) {
    const bizId = new Types.ObjectId(businessId);

    if (!payload.length) {
      throw new BadRequestException({
        message: 'No items provided',
        success: false,
        status: 400,
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const itemIds = payload.map(
        (p) => new Types.ObjectId(p.itemVendorOrderId),
      );

      // =========================
      // 1. FETCH ITEMS (to derive order + vendorOrder)
      // =========================
      const items =
        await this.orderRepository.findItemVendorOrdersByIdsWithSession(
          bizId,
          itemIds,
          session,
        );

      if (!items.length) {
        throw new BadRequestException('No valid items found');
      }

      // =========================
      // 2. UPDATE ITEMS IN BULK
      // =========================
      await this.orderRepository.markItemsAsSentToPickupCenter(
        itemIds,
        bizId,
        session,
      );
      // =========================
      // 3. DERIVE AFFECTED VENDOR ORDERS + ORDERS
      // =========================
      const vendorOrderIds = [
        ...new Set(items.map((i) => i.vendorOrderId.toString())),
      ];

      const orderIds = [...new Set(items.map((i) => i.orderId.toString()))];

      // =========================
      // 4. UPDATE VENDOR ORDERS STATUS
      // =========================
      const updatedVendorStatus =
        await this.orderRepository.updateManyOrderOfAVendor(
          bizId,
          vendorOrderIds,
          VendorOrderStatus.sent_to_pickup_center,
          session,
        );

      // =========================
      // 5. EMIT EVENTS (ONCE PER ORDER)
      // =========================
      for (const orderId of orderIds) {
        this.eventEmitter.emit(ShipmentEvents.item_sent_to_pickup_center, {
          orderId,
          pickupCenterId,
          vendorBusinessId: businessId,
          triggeredBy: user.sub.toString(),
        });
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        updatedItems: items.length,
        affectedOrders: orderIds.length,
        affectedVendorOrders: vendorOrderIds.length,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  async getVendorBusinessOrdersToFulfill(
    businessId: string,
    user: JwtUser,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response =
      await this.orderRepository.getVendorBusinessOrdersToFulfill(
        businessId,
        queryWithPaginationDto,
      );

    if (!response) {
      throw new NotFoundException({
        message: 'No order to fulfil is found.',
        status: 404,
        success: false,
      });
    }

    return response;
  }
}
