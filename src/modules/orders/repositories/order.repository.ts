import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import {
  Order,
  OrderDocument,
  OrderStatus,
  VendorOrderStatus,
} from '../schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument | null> {
    const order = new this.orderModel(createOrderDto);
    await order.save();

    return order;
  }

  async findOrderByOrderId(orderId: string): Promise<OrderDocument | null> {
    const id = new Types.ObjectId(orderId);
    const order = await this.orderModel
      .findById(id)
      .populate('customerId')
      .populate('vendors.vendorId')
      .populate('vendors.items.productId')
      .exec();

    return order;
  }

  // This is what we use to get the orders that a customer has made
  async findOrdersByCustomer(
    customerId: string,
  ): Promise<OrderDocument[] | null> {
    const id = new Types.ObjectId(customerId);
    const orders = await this.orderModel
      .find({ customerId: id })
      .sort({ createdAt: -1 })
      .exec();

    return orders;
  }

  // finding vendor orders
  async findOrdersByVendorId(
    vendorId: string,
  ): Promise<OrderDocument[] | null> {
    const id = new Types.ObjectId(vendorId);

    const orders = await this.orderModel
      .find({
        'vendorOrders.vendorId': id,
      })
      .exec();

    return orders;
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

  // Update vendor order status
  async updateVendorOrderStatus(
    orderId: string,
    vendorId: string,
    status: VendorOrderStatus,
  ): Promise<OrderDocument | null> {
    const vendor = new Types.ObjectId(vendorId);
    const order = new Types.ObjectId(orderId);

    const updatedOrder = await this.orderModel.findOneAndUpdate(
      {
        _id: order,
        'vendorOrders.vendorId': vendor,
      },
      {
        $set: {
          'vendorOrders.$.status': status,
        },
      },
      { returnDocument: 'after' },
    );

    return updatedOrder;
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
        $push: { deliveryIds: deliveryId },
      },
      { returnDocument: 'after' },
    );

    return attachedDelivery;
  }
}
