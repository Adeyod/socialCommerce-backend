import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import {
  Order,
  OrderDocument,
  OrderStatus,
  VendorItemOrderStatus,
  VendorOrderStatus,
} from '../schemas/order.schema';
import {
  ProcessedOrderData,
  ProcessedOrderDataObjectId,
} from '../types/processed-vendor.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async createOrder(
    createOrderDto: ProcessedOrderData,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    console.log('order repository:', createOrderDto);
    const order = new this.orderModel(this.toOrderPayload(createOrderDto));
    await order.save({ session });

    return order;
  }

  async findOrderByOrderIdWithoutSession(
    orderId: string,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);
    const order = await this.orderModel.findById(id).exec();

    return order;
  }
  async findOrderByOrderId(
    orderId: string,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);
    const order = await this.orderModel
      .findById(id, { session })
      .populate('customerId')
      .populate('vendors.vendorId')
      .populate('vendors.items.productId')
      .exec();

    return order;
  }

  // This is what we use to get the orders that a customer has made
  async findOrdersByCustomer(
    customerId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<OrderDocument[] | null> {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(customerId);

    const skip = (page - 1) * limit;

    let query = this.orderModel.find({ customerId: id });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { deliveryAddress: { $regex: regex } },
          { 'vendorOrders.items.name': { $regex: regex } },
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
          message: 'Page can not be found',
          status: 404,
          success: false,
        });
      }
    }

    const orders = await query.sort({ createdAt: -1 }).exec();

    return orders;
  }

  async getVendorSingleOrderByBusinessIdAndOrderId(
    orderId: string,
    businessId: string,
  ) {
    const response = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      'shipment.vendors.businessId': new Types.ObjectId(businessId),
    });

    return response;
  }

  async findOrdersByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(businessId);

    const matchStage: any = {
      'shipments.vendors.businessId': id,
    };

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      matchStage.$or = [
        { deliveryAddress: { $regex: regex } },
        { 'shipments.vendors.items.name': { $regex: regex } },
      ];
    }

    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: matchStage },

      {
        $project: {
          customerId: 1,
          subtotal: 1,
          total: 1,
          deliveryAddress: 1,
          status: 1,
          createdAt: 1,

          shipments: {
            $filter: {
              input: '$shipments',
              as: 's',
              cond: {
                $in: [id, '$$s.vendors.businessId'],
              },
            },
          },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    return this.orderModel.aggregate(pipeline);
  }

  async getBusinessStats(businessId: string) {
    const bizId = new Types.ObjectId(businessId);

    return this.orderModel.aggregate([
      { $unwind: '$shipments' },
      { $unwind: '$shipments.vendors' },
      { $unwind: '$shipments.vendors.items' },

      {
        $match: {
          'shipments.vendors.businessId': bizId,
          isPaid: true,
        },
      },

      {
        $group: {
          _id: null,

          orders: { $addToSet: '$_id' },

          revenue: {
            $sum: {
              $multiply: [
                '$shipments.vendors.items.price',
                '$shipments.vendors.items.quantity',
              ],
            },
          },
        },
      },

      {
        $project: {
          orders: { $size: '$orders' },
          revenue: 1,
        },
      },
    ]);
  }

  // update order(generic) to update any part of the order
  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      updateOrderDto,
      { returnDocument: 'after' },
    );

    return updatedOrder;
  }

  // Update global status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);
    const updatedStatus = await this.orderModel.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' },
    );

    return updatedStatus;
  }

  // Update business order status
  async updateBusinessOrderStatus(
    orderId: string,
    businessId: string,
    status: VendorOrderStatus,
  ) {
    const order = new Types.ObjectId(orderId);
    const biz = new Types.ObjectId(businessId);

    return this.orderModel.findOneAndUpdate(
      {
        _id: order,
        'shipments.vendors.businessId': biz,
      },
      {
        $set: {
          'shipments.$[].vendors.$[v].status': status,
        },
      },
      {
        arrayFilters: [{ 'v.businessId': biz }],
        returnDocument: 'after',
      },
    );
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

  async findOrderByIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(userId);
    const response = await this.orderModel.findOne({
      idempotencyKey,
      customerId: id,
    });

    return response;
  }

  async getBuyerOrderStats(userId: string) {
    const orderSummarry = await this.orderModel.aggregate([
      { $match: { customerId: new Types.ObjectId(userId) } },

      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                pendingOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
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
    ]);

    console.log('orderSummarry:', orderSummarry);

    return orderSummarry;
  }

  // async getVendorBusinessOrdersToFulfill(
  //   businessId: string,
  //   queryWithPaginationDto: QueryWithPaginationDto,
  // ) {
  //   const { page, limit, searchParams } = queryWithPaginationDto;

  //   const skip = (page - 1) * limit;

  //   let isObjectId: boolean = false;

  //   if (searchParams) {
  //     isObjectId = Types.ObjectId.isValid(searchParams);
  //   }

  //   return this.orderModel.aggregate([
  //     {
  //       $match: {
  //         isPaid: true,
  //         'shipment.vendors.businessId': new Types.ObjectId(businessId),
  //       },

  //       ...(searchParams
  //         ? {
  //             $or: [
  //               ...(isObjectId
  //                 ? [{ _id: new Types.ObjectId(searchParams) }]
  //                 : []),
  //               { status: { $regex: searchParams, $options: 'i' } },
  //             ],
  //           }
  //         : {}),
  //     },

  //     { $unwind: '$shipment.vendors' },

  //     {
  //       $match: {
  //         'shipment.vendors.businessId': new Types.ObjectId(businessId),
  //       },
  //     },

  //     {
  //       $project: {
  //         orderId: '$_id',
  //         deliveryMode: 1,
  //         pickupCenter: 1,
  //         status: 1,
  //         createdAt: 1,
  //         items: {
  //           $filter: {
  //             input: '$shipment.vendors.items',
  //             as: 'item',
  //             cond: {
  //               $ne: ['$$item.itemStatus', 'sent_to_pickup_center'],
  //             },
  //           },
  //         },
  //       },
  //     },

  //     {
  //       $match: {
  //         'items.0': { $exists: true }, // remove empty
  //       },
  //     },

  //     {
  //       $sort: {
  //         createdAt: -1,
  //       },
  //     },

  //     {
  //       $skip: skip,
  //     },
  //     {
  //       $limit: limit,
  //     },
  //   ]);
  // }

  async getVendorBusinessOrdersToFulfill(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;
    const bizId = new Types.ObjectId(businessId);

    const isObjectId = searchParams
      ? Types.ObjectId.isValid(searchParams)
      : false;

    return this.orderModel.aggregate([
      // 1. Base filter
      {
        $match: {
          isPaid: true,
          'shipment.vendors.businessId': bizId,

          ...(searchParams
            ? {
                $or: [
                  ...(isObjectId
                    ? [{ _id: new Types.ObjectId(searchParams) }]
                    : []),
                  { status: { $regex: searchParams, $options: 'i' } },
                ],
              }
            : {}),
        },
      },

      {
        $lookup: {
          from: 'pickupcenters', // your collection name
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

      // 2. Flatten vendor
      { $unwind: '$shipment.vendors' },

      // 3. Filter vendor only
      {
        $match: {
          'shipment.vendors.businessId': bizId,
        },
      },

      // 4. Shape data
      {
        $project: {
          orderId: '$_id',
          deliveryMode: 1,
          // pickupCenter: 1,
          pickupCenter: {
            _id: '$pickupCenter._id',
            name: '$pickupCenter.name',
            phone: '$pickupCenter.phone',
            address: '$pickupCenter.address',
          },
          status: 1,
          createdAt: 1,

          items: {
            $filter: {
              input: '$shipment.vendors.items',
              as: 'item',
              cond: {
                $ne: [
                  '$$item.itemStatus',
                  VendorItemOrderStatus.sent_to_pickup_center,
                ],
              },
            },
          },
        },
      },

      // 5. Remove empty
      {
        $match: {
          'items.0': { $exists: true },
        },
      },

      // 6. SORT + PAGINATION + COUNT in one go
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

      // 7. reshape output
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$meta.total', 0] },
        },
      },
    ]);
  }

  async getVendorBusinessSingleOrderDetailsForFulfilment(
    businessId: Types.ObjectId,
    orderId: Types.ObjectId,
  ) {
    // return this.orderModel.aggregate([

    //   {
    //     $match: {
    //       _id: orderId,
    //       isPaid: true,
    //       'shipment.vendors.businessId': businessId,
    //     },
    //   },

    //   { $unwind: '$shipment.vendors' },

    //   {
    //     $match: {
    //       'shipment.vendors.businessId': businessId,
    //     },
    //   },

    //   {
    //     $project: {
    //       orderId: '$_id',
    //       deliveryMode: 1,
    //       pickupCenter: 1,
    //       status: 1,
    //       createdAt: 1,

    //       vendor: {
    //         businessId: '$shipment.vendors.businessId',
    //         status: '$shipment.vendors.status',

    //         items: '$shipment.vendors.items',
    //         subtotal: '$shipment.vendors.subtotal',
    //       },
    //     },
    //   },
    // ]);

    return this.orderModel.aggregate([
      {
        $match: {
          _id: orderId,
          isPaid: true,
          'shipment.vendors.businessId': businessId,
        },
      },

      // 🔥 ADD THIS
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

      { $unwind: '$shipment.vendors' },

      {
        $match: {
          'shipment.vendors.businessId': businessId,
        },
      },

      {
        $project: {
          orderId: '$_id',
          deliveryMode: 1,
          pickupCenter: {
            _id: '$pickupCenter._id',
            name: '$pickupCenter.name',
            phone: '$pickupCenter.phone',
            address: '$pickupCenter.address',
          },
          status: 1,
          createdAt: 1,

          vendor: {
            businessId: '$shipment.vendors.businessId',
            status: '$shipment.vendors.status',
            items: '$shipment.vendors.items',
            subtotal: '$shipment.vendors.subtotal',
          },
        },
      },
    ]);
  }

  async markItemsAsSentToPickup(
    businessId: Types.ObjectId,
    orderIds: Types.ObjectId[],
  ) {
    return this.orderModel.updateMany(
      {
        _id: { $in: orderIds },
        'shipment.vendors.businessId': businessId,
      },
      {
        $set: {
          'shipment.vendors.$[v].items.$[i].itemStatus':
            VendorItemOrderStatus.sent_to_pickup_center,

          'shipment.vendors.$[v].status':
            VendorItemOrderStatus.sent_to_pickup_center,
        },
      },
      {
        arrayFilters: [
          { 'v.businessId': businessId },
          {
            'i.itemStatus': {
              $ne: VendorItemOrderStatus.sent_to_pickup_center,
            },
          },
        ],
      },
    );
  }

  async getOrdersForPickupCenter(
    pickupCenterId: string,
    query: QueryWithPaginationDto,
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const id = new Types.ObjectId(pickupCenterId);

    const result = await this.orderModel.aggregate([
      // 1. Filter orders for pickup center
      {
        $match: {
          destinationPickupCenter: id,
          isPaid: true,
        },
      },

      // 2. Enrich vendor business data
      {
        $lookup: {
          from: 'businesses',
          localField: 'shipment.vendors.businessId',
          foreignField: '_id',
          as: 'vendorBusinesses',
        },
      },

      // 3. Merge business info into vendors
      {
        $addFields: {
          'shipment.vendors': {
            $map: {
              input: '$shipment.vendors',
              as: 'v',
              in: {
                $mergeObjects: [
                  '$$v',
                  {
                    business: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$vendorBusinesses',
                            as: 'b',
                            cond: { $eq: ['$$b._id', '$$v.businessId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // 4. Sort + pagination + count in one query
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                orderId: '$_id',
                status: 1,
                deliveryMode: 1,
                createdAt: 1,
                subtotal: 1,
                total: 1,
                shipment: 1,
              },
            },
          ],

          meta: [{ $count: 'total' }],
        },
      },

      // 5. reshape output
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

    const result = await this.orderModel.aggregate([
      // 1. Filter orders for pickup center
      {
        $match: {
          destinationPickupCenter: id,
          isPaid: true,
        },
      },

      // 2. Enrich vendor data
      {
        $lookup: {
          from: 'businesses',
          localField: 'shipment.vendors.businessId',
          foreignField: '_id',
          as: 'vendorBusinesses',
        },
      },

      {
        $addFields: {
          'shipment.vendors': {
            $map: {
              input: '$shipment.vendors',
              as: 'v',
              in: {
                $mergeObjects: [
                  '$$v',
                  {
                    business: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$vendorBusinesses',
                            as: 'b',
                            cond: { $eq: ['$$b._id', '$$v.businessId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // 3. Flatten for item-level view
      { $unwind: '$shipment.vendors' },
      { $unwind: '$shipment.vendors.items' },

      // 4. Filter pending items
      {
        $match: {
          'shipment.vendors.items.itemStatus': {
            $ne: 'received_at_pickup_center',
          },
        },
      },

      // 5. Build final shape
      {
        $project: {
          orderId: '$_id',

          vendorId: '$shipment.vendors.businessId',

          vendor: {
            _id: '$shipment.vendors.businessId',
            name: '$shipment.vendors.business.name',
            phone: '$shipment.vendors.business.phone',
            email: '$shipment.vendors.business.email',
          },

          product: '$shipment.vendors.items',

          vendorStatus: '$shipment.vendors.status',

          deliveryMode: 1,
          createdAt: 1,
        },
      },

      // 6. SORT + PAGINATION + COUNT
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

      // 7. reshape output
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
      shipment: dto.shipment,
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
}
