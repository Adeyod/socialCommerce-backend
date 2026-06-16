import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { MarkItemReceivedDto } from '../dtos/mark-item-received.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import {
  ItemVendorOrder,
  ItemVendorOrderDocument,
  VendorItemOrderStatus,
} from '../schemas/item-vendor-order.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
  ShipmentStatus,
} from '../schemas/order.schema';
import {
  VendorOrder,
  VendorOrderDocument,
  VendorOrderStatus,
} from '../schemas/vendor-order.schema';
import {
  ProcessedOrderData,
  ProcessedOrderDataObjectId,
} from '../types/processed-vendor.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(VendorOrder.name)
    private readonly vendorOrderModel: Model<VendorOrderDocument>,
    @InjectModel(ItemVendorOrder.name)
    private readonly itemVendorOrderModel: Model<ItemVendorOrderDocument>,
  ) {}

  async updateOneItemVendorOrderStatus(
    dto: MarkItemReceivedDto,
    status: VendorItemOrderStatus,
    session: ClientSession,
  ) {
    const {
      orderId,
      vendorOrderId,
      itemVendorOrderId,
      pickupCenterId,
      businessId,
    } = dto;
    const response = await this.itemVendorOrderModel.updateOne(
      {
        _id: new Types.ObjectId(itemVendorOrderId),
        orderId: new Types.ObjectId(orderId),
        vendorOrderId: new Types.ObjectId(vendorOrderId),
        businessId: new Types.ObjectId(businessId),
        status: {
          $ne: status,
        },
      },
      {
        $set: {
          status: status,
          shipmentId: pickupCenterId, // optional tracking link
        },
      },
      { session },
    );

    return response;
  }

  async countItemVendorOrderDocumentNotYetAtPickupCenter(
    vendorOrderId: string,
    session: ClientSession,
  ) {
    const count = await this.itemVendorOrderModel.countDocuments(
      {
        vendorOrderId: new Types.ObjectId(vendorOrderId),
        status: {
          $ne: VendorItemOrderStatus.received_at_pickup_center,
        },
      },
      { session },
    );

    return count;
  }

  async countAllItemsNotYetAtPickupCenterInAnOrderDocument(
    orderId: string,
    status: VendorItemOrderStatus,
    session: ClientSession,
  ) {
    const count = await this.itemVendorOrderModel.countDocuments(
      {
        orderId: new Types.ObjectId(orderId),
        status: {
          $ne: status,
        },
      },
      { session },
    );

    return count;
  }

  async updateOrderStatusWithSession(
    orderId: string,
    status: OrderStatus,
    session: ClientSession,
  ) {
    const response = await this.orderModel.updateOne(
      {
        _id: new Types.ObjectId(orderId),
      },
      {
        $set: {
          status: status,
        },
      },
      { session },
    );

    return response;
  }

  async updateOneVendorOrderStatus(
    vendorOrderId: string,
    businessId: string,
    status: VendorOrderStatus,
    session: ClientSession,
  ) {
    const response = await this.vendorOrderModel.updateOne(
      {
        _id: new Types.ObjectId(vendorOrderId),
        businessId: new Types.ObjectId(businessId),
      },
      {
        $set: {
          status: status,
        },
      },
      { session },
    );

    return response;
  }

  // async increment

  async createOrder(
    createOrderDto: ProcessedOrderData,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    console.log('order repository:', createOrderDto);
    const order = new this.orderModel(this.toOrderPayload(createOrderDto));
    await order.save({ session });

    return order;
  }
  async findOrderByOrderIdWithoutSession(orderId: string): Promise<any> {
    const id = new Types.ObjectId(orderId);

    const result = await this.orderModel.aggregate([
      {
        $match: { _id: id },
      },

      // Customer info
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ['$customer', 0] },
        },
      },

      // ✅ Vendor Orders
      {
        $lookup: {
          from: 'vendororders', // collection name
          localField: '_id',
          foreignField: 'orderId',
          as: 'vendorOrders',
        },
      },

      // ✅ Attach Items to each Vendor
      {
        $lookup: {
          from: 'itemvendororders',
          localField: 'vendorOrders._id',
          foreignField: 'vendorOrderId',
          as: 'allItems',
        },
      },

      // ✅ Group items under each vendor
      {
        $addFields: {
          vendorOrders: {
            $map: {
              input: '$vendorOrders',
              as: 'vendor',
              in: {
                _id: '$$vendor._id',
                businessId: '$$vendor.businessId',
                status: '$$vendor.status',
                subtotal: '$$vendor.subtotal',

                items: {
                  $filter: {
                    input: '$allItems',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.vendorOrderId', '$$vendor._id'],
                    },
                  },
                },
              },
            },
          },
        },
      },

      // remove temp array
      {
        $project: {
          allItems: 0,
        },
      },
    ]);

    return result[0] || null;
  }
  async findOrderByOrderId(
    orderId: string,
    session: ClientSession,
  ): Promise<any> {
    const id = new Types.ObjectId(orderId);

    const result = await this.orderModel
      .aggregate([
        {
          $match: { _id: id },
        },

        // Customer info
        {
          $lookup: {
            from: 'users',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $addFields: {
            customer: { $arrayElemAt: ['$customer', 0] },
          },
        },

        // ✅ Vendor Orders
        {
          $lookup: {
            from: 'vendororders', // collection name
            localField: '_id',
            foreignField: 'orderId',
            as: 'vendorOrders',
          },
        },

        // ✅ Attach Items to each Vendor
        {
          $lookup: {
            from: 'itemvendororders',
            localField: 'vendorOrders._id',
            foreignField: 'vendorOrderId',
            as: 'allItems',
          },
        },

        // ✅ Group items under each vendor
        {
          $addFields: {
            vendorOrders: {
              $map: {
                input: '$vendorOrders',
                as: 'vendor',
                in: {
                  _id: '$$vendor._id',
                  businessId: '$$vendor.businessId',
                  status: '$$vendor.status',
                  subtotal: '$$vendor.subtotal',

                  items: {
                    $filter: {
                      input: '$allItems',
                      as: 'item',
                      cond: {
                        $eq: ['$$item.vendorOrderId', '$$vendor._id'],
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // remove temp array
        {
          $project: {
            allItems: 0,
          },
        },
      ])
      .session(session);

    return result[0] || null;
  }

  // This is what we use to get the orders that a customer has made
  async findOrdersByCustomer(
    customerId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<any> {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;
    const customerObjectId = new Types.ObjectId(customerId);

    const pipeline: any[] = [
      // Step 1: match customer
      {
        $match: {
          customerId: customerObjectId,
        },
      },

      // Step 2: attach vendor orders
      {
        $lookup: {
          from: 'vendororders',
          localField: '_id',
          foreignField: 'orderId',
          as: 'vendorOrders',
        },
      },

      // Step 3: attach items
      {
        $lookup: {
          from: 'itemvendororders',
          localField: 'vendorOrders._id',
          foreignField: 'vendorOrderId',
          as: 'items',
        },
      },

      // Step 4: optional search
      ...(searchParams
        ? [
            {
              $match: {
                $or: [
                  {
                    'deliveryAddress.street': {
                      $regex: searchParams,
                      $options: 'i',
                    },
                  },
                  {
                    'items.name': {
                      $regex: searchParams,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
          ]
        : []),

      // Step 5: sort
      {
        $sort: { createdAt: -1 },
      },

      // Step 6: pagination + count
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },

            // optional: shape response
            {
              $project: {
                _id: 1,
                status: 1,
                total: 1,
                createdAt: 1,
                deliveryMode: 1,
              },
            },
          ],

          meta: [{ $count: 'total' }],
        },
      },

      // Step 7: reshape output
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$meta.total', 0] },
          page: { $literal: page },
          limit: { $literal: limit },
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline);

    return result[0] || { data: [], total: 0, page, limit };
  }

  async getVendorSingleOrderByBusinessIdAndOrderId(
    orderId: string,
    businessId: string,
  ) {
    const orderObjectId = new Types.ObjectId(orderId);
    const businessObjectId = new Types.ObjectId(businessId);

    const result = await this.orderModel.aggregate([
      // Step 1: match order
      {
        $match: {
          _id: orderObjectId,
        },
      },

      // Step 2: get ONLY this vendor's order
      {
        $lookup: {
          from: 'vendororders',
          let: { orderId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$orderId', '$$orderId'] },
                    { $eq: ['$businessId', businessObjectId] },
                  ],
                },
              },
            },
          ],
          as: 'vendorOrder',
        },
      },

      // If vendor has no order in this order → return null
      {
        $match: {
          'vendorOrder.0': { $exists: true },
        },
      },

      // Flatten vendorOrder
      {
        $addFields: {
          vendorOrder: { $arrayElemAt: ['$vendorOrder', 0] },
        },
      },

      // Step 3: attach ONLY this vendor's items
      {
        $lookup: {
          from: 'itemvendororders',
          localField: 'vendorOrder._id',
          foreignField: 'vendorOrderId',
          as: 'items',
        },
      },

      // Step 4: shape response
      {
        $project: {
          _id: 0,

          orderId: '$_id',
          orderStatus: '$status',
          createdAt: 1,

          vendor: {
            businessId: '$vendorOrder.businessId',
            status: '$vendorOrder.status',
            subtotal: '$vendorOrder.subtotal',
          },

          items: 1,
        },
      },
    ]);

    return result[0] || null;
  }

  async findOrdersByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;
    const bizId = new Types.ObjectId(businessId);

    const pipeline: any[] = [
      // 1. Filter vendor orders early (FAST)
      {
        $match: {
          businessId: bizId,
        },
      },

      // 2. Join Order
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },

      // 3. Join ONLY this vendor's items
      {
        $lookup: {
          from: 'itemvendororders',
          localField: '_id',
          foreignField: 'vendorOrderId',
          as: 'items',
        },
      },

      // 4. SEARCH (single unified stage)
      ...(searchParams
        ? [
            {
              $match: {
                $or: [
                  {
                    status: {
                      $regex: searchParams,
                      $options: 'i',
                    },
                  },
                  {
                    'items.name': {
                      $regex: searchParams,
                      $options: 'i',
                    },
                  },
                  {
                    'order.deliveryAddress.street': {
                      $regex: searchParams,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
          ]
        : []),

      // 5. Shape response
      {
        $project: {
          orderId: '$order._id',
          customerId: '$order.customerId',

          deliveryAddress: '$order.deliveryAddress',
          orderStatus: '$order.status',
          createdAt: '$order.createdAt',

          vendorOrderId: '$_id',
          vendorStatus: '$status',
          subtotal: '$subtotal',

          items: 1,
        },
      },

      // 6. PAGINATION + COUNT (VERY IMPORTANT)
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          meta: [{ $count: 'total' }],
        },
      },

      // 7. Format output
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$meta.total', 0] },
          page: { $literal: page },
          limit: { $literal: limit },
        },
      },
    ];

    const result = await this.vendorOrderModel.aggregate(pipeline);

    return result[0] || { data: [], total: 0, page, limit };
  }

  async getBusinessStats(businessId: string) {
    const bizId = new Types.ObjectId(businessId);

    const result = await this.vendorOrderModel.aggregate([
      // 1. Filter vendor orders
      {
        $match: {
          businessId: bizId,
        },
      },

      // 2. Join items
      {
        $lookup: {
          from: 'itemvendororders',
          localField: '_id',
          foreignField: 'vendorOrderId',
          as: 'items',
        },
      },

      // 3. Flatten items
      { $unwind: '$items' },

      // 4. Compute stats
      {
        $group: {
          _id: null,

          orders: { $addToSet: '$orderId' },

          revenue: {
            $sum: {
              $multiply: ['$items.price', '$items.quantity'],
            },
          },

          totalItemsSold: {
            $sum: '$items.quantity',
          },
        },
      },

      // 5. Format output
      {
        $project: {
          _id: 0,
          orders: { $size: '$orders' },
          revenue: 1,
          totalItemsSold: 1,
        },
      },
    ]);

    return (
      result[0] || {
        orders: 0,
        revenue: 0,
        totalItemsSold: 0,
      }
    );
  }

  // update order(generic) to update any part of the order
  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);

    // ONLY allow safe buyer-editable fields
    const allowedUpdate: any = {};

    if (updateOrderDto.deliveryAddress) {
      allowedUpdate.deliveryAddress = updateOrderDto.deliveryAddress;
    }

    if (updateOrderDto.contactPhone) {
      allowedUpdate.contactPhone = updateOrderDto.contactPhone;
    }

    if (updateOrderDto.notes) {
      allowedUpdate.notes = updateOrderDto.notes;
    }

    // ⚠️ Status must be restricted (optional rule)
    if (updateOrderDto.status) {
      const allowedStatuses = ['pending', 'processing', 'cancelled'];

      if (!allowedStatuses.includes(updateOrderDto.status)) {
        throw new BadRequestException('Invalid status update');
      }

      allowedUpdate.status = updateOrderDto.status;
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      {
        $set: allowedUpdate,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return updatedOrder;
  }

  // Update global status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);

    // 1. Get current order
    const order = await this.orderModel.findById(id);

    if (!order) return null;

    // 2. Prevent invalid transitions
    const allowedTransitions: Record<string, OrderStatus[]> = {
      pending: [OrderStatus.processing, OrderStatus.cancelled],
      processing: [OrderStatus.completed, OrderStatus.cancelled],
      completed: [],
      cancelled: [],
    };

    const currentStatus = order.status;

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${status}`,
      );
    }

    // 3. Update order status safely
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return updatedOrder;
  }

  // Update business order status
  async updateBusinessOrderStatus(
    orderId: string,
    businessId: string,
    status: VendorOrderStatus,
  ) {
    const orderObjectId = new Types.ObjectId(orderId);
    const businessObjectId = new Types.ObjectId(businessId);

    // 1. Update ONLY the vendor_order document
    const updatedVendorOrder = await this.vendorOrderModel.findOneAndUpdate(
      {
        orderId: orderObjectId,
        businessId: businessObjectId,
      },
      {
        $set: { status },
      },
      {
        new: true,
      },
    );

    if (!updatedVendorOrder) {
      throw new NotFoundException('Vendor order not found');
    }

    // 2. OPTIONAL: sync order status (derived logic later is better)
    return updatedVendorOrder;
  }

  async findOrderByIdempotencyKey(idempotencyKey: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const result = await this.orderModel.aggregate([
      // 1. Match order
      {
        $match: {
          idempotencyKey,
          customerId: userObjectId,
        },
      },

      // 2. Attach vendor orders
      {
        $lookup: {
          from: 'vendororders',
          localField: '_id',
          foreignField: 'orderId',
          as: 'vendorOrders',
        },
      },

      // 3. Attach items for all vendor orders
      {
        $lookup: {
          from: 'itemvendororders',
          let: { vendorOrders: '$vendorOrders' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$vendorOrderId', '$$vendorOrders._id'],
                },
              },
            },
          ],
          as: 'items',
        },
      },

      // 4. Shape response (FULL ORDER SNAPSHOT)
      {
        $project: {
          _id: 1,
          customerId: 1,
          subtotal: 1,
          shippingFeeTotal: 1,
          collectionFee: 1,
          deliveryFee: 1,
          total: 1,
          status: 1,
          deliveryAddress: 1,
          contactPhone: 1,
          createdAt: 1,

          vendorOrders: {
            $map: {
              input: '$vendorOrders',
              as: 'v',
              in: {
                _id: '$$v._id',
                businessId: '$$v.businessId',
                status: '$$v.status',
                subtotal: '$$v.subtotal',

                items: {
                  $filter: {
                    input: '$items',
                    as: 'i',
                    cond: {
                      $eq: ['$$i.vendorOrderId', '$$v._id'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    return result[0] || null;
  }

  async getBuyerOrderStats(userId: string) {
    const id = new Types.ObjectId(userId);

    const result = await this.orderModel.aggregate([
      { $match: { customerId: id } },

      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                pendingOrders: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OrderStatus.pending] }, 1, 0],
                  },
                },
                completedOrders: {
                  $sum: {
                    $cond: [{ $eq: ['$status', OrderStatus.completed] }, 1, 0],
                  },
                },
              },
            },
          ],

          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                status: 1,
                total: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          stats: {
            $ifNull: [
              { $arrayElemAt: ['$stats', 0] },
              {
                totalOrders: 0,
                pendingOrders: 0,
                completedOrders: 0,
              },
            ],
          },
          recentOrders: 1,
        },
      },
    ]);

    const response = result?.[0] || {
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
      },
      recentOrders: [],
    };

    return response;
  }

  async getVendorBusinessOrdersToFulfill(
    businessId: string,
    query: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10, searchParams } = query;

    const skip = (page - 1) * limit;
    const bizId = new Types.ObjectId(businessId);

    const isObjectId = searchParams
      ? Types.ObjectId.isValid(searchParams)
      : false;

    // =====================================================
    // 1. BUILD VENDOR ORDERS FILTER
    // =====================================================
    const vendorOrderFilter: any = {
      businessId: bizId,
    };

    // optional search
    if (searchParams) {
      vendorOrderFilter.$or = [
        ...(isObjectId ? [{ orderId: new Types.ObjectId(searchParams) }] : []),
        { status: { $regex: searchParams, $options: 'i' } },
      ];
    }

    // =====================================================
    // 2. GET VENDOR ORDERS FIRST (MAIN DRIVER)
    // =====================================================
    const vendorOrders = await this.vendorOrderModel
      .find(vendorOrderFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const vendorOrderIds = vendorOrders.map((v) => v._id);
    const orderIds = [
      ...new Set(vendorOrders.map((v) => v.orderId.toString())),
    ];

    // =====================================================
    // 3. FETCH ITEMS (NO LOOKUP, JUST INDEX QUERY)
    // =====================================================
    const items = await this.itemVendorOrderModel
      .find({
        vendorOrderId: { $in: vendorOrderIds },
        status: {
          $ne: VendorItemOrderStatus.sent_to_pickup_center,
        },
      })
      .lean();

    const itemsByVendorOrder = new Map<string, any[]>();

    for (const item of items) {
      const key = item.vendorOrderId.toString();
      if (!itemsByVendorOrder.has(key)) {
        itemsByVendorOrder.set(key, []);
      }
      itemsByVendorOrder.get(key)!.push(item);
    }

    // =====================================================
    // 4. FETCH ORDERS (PICKUP CENTER INFO)
    // =====================================================
    const orders = await this.orderModel
      .find({
        _id: { $in: orderIds.map((id) => new Types.ObjectId(id)) },
      })
      .select('status deliveryMode destinationPickupCenter createdAt')
      .lean();

    const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));

    // =====================================================
    // 5. BUILD FINAL RESPONSE
    // =====================================================
    const data = vendorOrders
      .map((vendor) => {
        const order = orderMap.get(vendor.orderId.toString());
        const items = itemsByVendorOrder.get(vendor._id.toString()) || [];

        if (items.length === 0) return null;

        return {
          orderId: vendor.orderId,
          vendorOrderId: vendor._id,
          businessId: vendor.businessId,
          status: vendor.status,
          subtotal: vendor.subtotal,
          // createdAt: vendor.createdAt,

          order: order
            ? {
                status: order.status,
                deliveryMode: order.deliveryMode,
                pickupCenter: order.destinationPickupCenter,
                // createdAt: order.createdAt,
              }
            : null,

          items,
        };
      })
      .filter(Boolean);

    // =====================================================
    // 6. COUNT (FAST)
    // =====================================================
    const total = await this.vendorOrderModel.countDocuments({
      businessId: bizId,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
  // ***********************
  async getVendorBusinessSingleOrderDetailsForFulfilment(
    businessId: Types.ObjectId,
    orderId: Types.ObjectId,
  ) {
    return this.orderModel.aggregate([
      // 1. Match Order
      {
        $match: {
          _id: orderId,
          isPaid: true,
        },
      },

      // 2. Lookup VendorOrder (ONLY this vendor)
      {
        $lookup: {
          from: 'vendororders',
          let: { orderId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$orderId', '$$orderId'] },
                    { $eq: ['$businessId', businessId] },
                  ],
                },
              },
            },
          ],
          as: 'vendorOrder',
        },
      },

      // 3. Ensure vendor exists
      {
        $unwind: {
          path: '$vendorOrder',
          preserveNullAndEmptyArrays: false,
        },
      },

      // 4. Lookup Items for that vendor
      {
        $lookup: {
          from: 'itemvendororders',
          let: { vendorOrderId: '$vendorOrder._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$vendorOrderId', '$$vendorOrderId'],
                },
              },
            },
          ],
          as: 'items',
        },
      },

      // 5. Lookup Pickup Center
      {
        $lookup: {
          from: 'pickupcenters',
          localField: 'destinationPickupCenter',
          foreignField: '_id',
          as: 'pickupCenter',
        },
      },

      {
        $addFields: {
          pickupCenter: { $arrayElemAt: ['$pickupCenter', 0] },
        },
      },

      // 6. Shape response
      {
        $project: {
          orderId: '$_id',
          deliveryMode: 1,
          status: 1,
          createdAt: 1,

          pickupCenter: {
            _id: '$pickupCenter._id',
            name: '$pickupCenter.name',
            phone: '$pickupCenter.phone',
            address: '$pickupCenter.address',
          },

          vendor: {
            businessId: '$vendorOrder.businessId',
            status: '$vendorOrder.status',
            subtotal: '$vendorOrder.subtotal',

            items: {
              $map: {
                input: '$items',
                as: 'item',
                in: {
                  productId: '$$item.productId',
                  name: '$$item.name',
                  price: '$$item.price',
                  quantity: '$$item.quantity',
                  itemStatus: '$$item.status',
                },
              },
            },
          },
        },
      },
    ]);
  }

  async getOrdersForPickupCenter(
    pickupCenterId: string,
    query: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const id = new Types.ObjectId(pickupCenterId);

    const result = await this.orderModel.aggregate([
      // 1. Match orders for pickup center
      {
        $match: {
          destinationPickupCenter: id,
          isPaid: true,
        },
      },

      // 2. Lookup vendor orders
      {
        $lookup: {
          from: 'vendororders',
          localField: '_id',
          foreignField: 'orderId',
          as: 'vendorOrders',
        },
      },

      // 3. Unwind vendorOrders
      {
        $unwind: {
          path: '$vendorOrders',
          preserveNullAndEmptyArrays: false,
        },
      },

      // 4. Lookup business
      {
        $lookup: {
          from: 'businesses',
          localField: 'vendorOrders.businessId',
          foreignField: '_id',
          as: 'business',
        },
      },

      {
        $addFields: {
          'vendorOrders.business': {
            $arrayElemAt: ['$business', 0],
          },
        },
      },

      // 5. (OPTIONAL) attach items
      {
        $lookup: {
          from: 'itemvendororders',
          localField: 'vendorOrders._id',
          foreignField: 'vendorOrderId',
          as: 'vendorOrders.items',
        },
      },

      // 6. regroup vendors per order
      {
        $group: {
          _id: '$_id',
          order: { $first: '$$ROOT' },
          vendorOrders: { $push: '$vendorOrders' },
        },
      },

      // 7. final projection
      {
        $project: {
          orderId: '$_id',
          status: '$order.status',
          deliveryMode: '$order.deliveryMode',
          createdAt: '$order.createdAt',
          subtotal: '$order.subtotal',
          total: '$order.total',
          vendorOrders: 1,
        },
      },

      // 8. pagination
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          meta: [{ $count: 'total' }],
        },
      },

      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$meta.total', 0] },
        },
      },
    ]);

    return {
      data: result[0]?.data || [],
      total: result[0]?.total || 0,
      page,
      limit,
    };
  }

  async getPendingPickupCenterItems(
    pickupCenterId: string,
    query: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const id = new Types.ObjectId(pickupCenterId);

    const result = await this.itemVendorOrderModel.aggregate([
      // 1. Filter ONLY pending items first (VERY IMPORTANT for performance)
      {
        $match: {
          status: { $ne: 'received_at_pickup_center' },
        },
      },

      // 2. Join VendorOrder
      {
        $lookup: {
          from: 'vendororders',
          localField: 'vendorOrderId',
          foreignField: '_id',
          as: 'vendorOrder',
        },
      },
      { $unwind: '$vendorOrder' },

      // 3. Join Order
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },

      // 4. Filter by pickup center + paid
      {
        $match: {
          'order.destinationPickupCenter': id,
          'order.isPaid': true,
        },
      },

      // 5. Join Business (vendor)
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business',
        },
      },
      {
        $addFields: {
          business: { $arrayElemAt: ['$business', 0] },
        },
      },

      // 6. Shape final response
      {
        $project: {
          orderId: '$order._id',

          vendorId: '$businessId',

          vendor: {
            _id: '$business._id',
            name: '$business.name',
            phone: '$business.phone',
            email: '$business.email',
          },

          product: {
            productId: '$productId',
            name: '$name',
            price: '$price',
            quantity: '$quantity',
            status: '$status',
          },

          vendorStatus: '$vendorOrder.status',

          deliveryMode: '$order.deliveryMode',
          createdAt: '$order.createdAt',
        },
      },

      // 7. Pagination
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          meta: [{ $count: 'total' }],
        },
      },

      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$meta.total', 0] },
        },
      },
    ]);

    return {
      data: result[0]?.data || [],
      total: result[0]?.total || 0,
      page,
      limit,
    };
  }

  // async markItemsAsSentToPickup(
  //   businessId: Types.ObjectId,
  //   itemIds: Types.ObjectId[],
  // ) {
  //   // 1. Update item statuses
  //   const updateItemsResult = await this.itemVendorOrderModel.updateMany(
  //     {
  //       _id: { $in: itemIds },
  //       businessId,
  //       status: {
  //         $ne: VendorItemOrderStatus.sent_to_pickup_center,
  //       },
  //     },
  //     {
  //       $set: {
  //         status: VendorItemOrderStatus.sent_to_pickup_center,
  //       },
  //     },
  //   );

  //   // 2. Get affected vendorOrderIds
  //   const affectedVendorOrders = await this.itemVendorOrderModel.distinct(
  //     'vendorOrderId',
  //     {
  //       _id: { $in: itemIds },
  //       businessId,
  //     },
  //   );

  //   // 3. Update VendorOrder status ONLY if all items are sent
  //   await this.vendorOrderModel.updateMany(
  //     {
  //       _id: { $in: affectedVendorOrders },
  //       businessId,
  //     },
  //     [
  //       {
  //         $lookup: {
  //           from: 'itemvendororders',
  //           localField: '_id',
  //           foreignField: 'vendorOrderId',
  //           as: 'items',
  //         },
  //       },
  //       {
  //         $set: {
  //           status: {
  //             $cond: [
  //               {
  //                 $allElementsTrue: {
  //                   $map: {
  //                     input: '$items',
  //                     as: 'item',
  //                     in: {
  //                       $eq: [
  //                         '$$item.status',
  //                         VendorItemOrderStatus.sent_to_pickup_center,
  //                       ],
  //                     },
  //                   },
  //                 },
  //               },
  //               VendorItemOrderStatus.sent_to_pickup_center,
  //               '$status',
  //             ],
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           items: 0,
  //         },
  //       },
  //     ],
  //   );

  //   return {
  //     updatedItems: updateItemsResult.modifiedCount,
  //     affectedVendorOrders: affectedVendorOrders.length,
  //   };
  // }

  async markSingleItemAsSentToPickup(
    businessId: Types.ObjectId,
    itemId: Types.ObjectId,
    session: ClientSession,
  ) {
    return this.itemVendorOrderModel.findOneAndUpdate(
      {
        _id: itemId,
        businessId,
        status: { $ne: VendorItemOrderStatus.sent_to_pickup_center },
      },
      {
        $set: {
          status: VendorItemOrderStatus.sent_to_pickup_center,
        },
      },
      {
        new: true,
        session,
      },
    );
  }

  async syncVendorOrderAfterItemUpdate(
    vendorOrderId: Types.ObjectId,
    businessId: Types.ObjectId,
    session: ClientSession,
  ) {
    const [totalItems, sentItems] = await Promise.all([
      this.itemVendorOrderModel
        .countDocuments({
          vendorOrderId,
          businessId,
        })
        .session(session),

      this.itemVendorOrderModel
        .countDocuments({
          vendorOrderId,
          businessId,
          status: VendorItemOrderStatus.sent_to_pickup_center,
        })
        .session(session),
    ]);

    const isComplete = totalItems === sentItems;

    if (isComplete) {
      await this.vendorOrderModel.updateOne(
        { _id: vendorOrderId },
        {
          $set: {
            status: VendorOrderStatus.sent_to_pickup_center,
          },
        },
        { session },
      );
    }

    return isComplete;
  }

  async markItemsAsSentToPickupCenter(
    itemIds: Types.ObjectId[],
    businessId: Types.ObjectId,
    session: ClientSession,
  ) {
    if (!itemIds.length) return { matchedCount: 0, modifiedCount: 0 };

    const bulkOps = itemIds.map((id) => ({
      updateOne: {
        filter: {
          _id: id,
          businessId: businessId,
        },
        update: {
          $set: {
            status: VendorItemOrderStatus.sent_to_pickup_center,
          },
        },
      },
    }));

    return this.itemVendorOrderModel.bulkWrite(bulkOps, { session });
  }

  async syncOrderAfterVendorUpdate(
    orderId: Types.ObjectId,
    session: ClientSession,
  ) {
    const [totalVendors, sentVendors] = await Promise.all([
      this.vendorOrderModel
        .countDocuments({
          orderId,
        })
        .session(session),

      this.vendorOrderModel
        .countDocuments({
          orderId,
          status: VendorOrderStatus.sent_to_pickup_center,
        })
        .session(session),
    ]);

    const isComplete = totalVendors === sentVendors;

    if (isComplete) {
      await this.orderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            status: ShipmentStatus.arrived,
          },
        },
        { session },
      );
    }

    return isComplete;
  }

  async updateManyOrderOfAVendor(
    bizId: Types.ObjectId,
    vendorOrderIds: string[],
    status: VendorOrderStatus,
    session: ClientSession,
  ) {
    const response = await this.vendorOrderModel.updateMany(
      {
        _id: { $in: vendorOrderIds.map((id) => new Types.ObjectId(id)) },
        businessId: bizId,
      },
      {
        $set: {
          status: status,
        },
      },
      { session },
    );
  }

  async markItemAsReceivedAtPickupCenter(
    pickupCenterId: string,
    orderId: string,
    businessId: string,
    productId: string,
  ) {
    return this.orderModel.updateOne(
      {
        _id: new Types.ObjectId(orderId),
        destinationPickupCenter: new Types.ObjectId(pickupCenterId),
        // destinationPickupCenter: { $exists: true },
      },
      {
        $set: {
          'shipment.vendors.$[v].items.$[i].itemStatus':
            VendorItemOrderStatus.received_at_pickup_center,
        },
      },
      {
        arrayFilters: [
          { 'v.businessId': new Types.ObjectId(businessId) },
          { 'i.productId': new Types.ObjectId(productId) },
        ],
      },
    );
  }

  async findItemVendorOrdersByIdsWithSession(
    bizId: Types.ObjectId,
    itemIds: Types.ObjectId[],
    session: ClientSession,
  ) {
    const items = await this.itemVendorOrderModel.find(
      {
        _id: { $in: itemIds },
        businessId: bizId,
      },
      null,
      { session },
    );

    return items;
  }

  async createVendorOrder(
    payload: Partial<VendorOrder>,
    session?: ClientSession,
  ) {
    const doc = new this.vendorOrderModel(payload);
    await doc.save({ session });
    return doc;
  }

  async createItemVendorOrders(
    payload: Partial<ItemVendorOrder>[],
    session?: ClientSession,
  ) {
    return this.itemVendorOrderModel.insertMany(payload, { session });
  }
  private toOrderPayload(dto: ProcessedOrderData): ProcessedOrderDataObjectId {
    const response = {
      cartId: dto.cartId,
      shippingFeeTotal: dto.shippingFeeTotal,
      collectionFee: dto.collectionFee,
      destinationPickupCenter: dto.destinationPickupCenter
        ? new Types.ObjectId(dto.destinationPickupCenter)
        : null,
      customerId: new Types.ObjectId(dto.customerId),
      deliveryMode: dto.deliveryMode,
      // shipment: dto.shipment,
      subtotal: dto.subtotal,
      deliveryFee: dto.deliveryFee,
      total: dto.total,
      deliveryAddress: dto.deliveryAddress,
      contactPhone: dto.contactPhone,
      idempotencyKey: dto.idempotencyKey,
      isPaid: dto.isPaid ?? false,
      status: dto.status,
    };
    console.log('toOrderPayload response:', response);
    return response;
  }

  // Attach delivery
  async attachDelivery(
    orderId: string,
    deliveryId: string,
  ): Promise<OrderDocument | null> {
    const order = new Types.ObjectId(orderId);
    const delivery = new Types.ObjectId(deliveryId);

    const attachedDelivery = await this.orderModel.findByIdAndUpdate(
      order,
      {
        $push: { deliveryIds: delivery },
      },
      { returnDocument: 'after' },
    );

    return attachedDelivery;
  }
}
