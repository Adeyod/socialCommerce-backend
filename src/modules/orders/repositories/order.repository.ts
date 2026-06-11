import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import {
  Order,
  OrderDocument,
  OrderStatus,
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
