import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtUser } from '../../common/types/jwt-user.type';
import { ProductsRepository } from '../products/repositories/product.repository';
import { CreateOrderDto, CreateVendorOrderDto } from './dtos/create-order.dto';
import { OrderRepository } from './repositories/order.repository';
import { OrderStatus, VendorOrderStatus } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async createOrder(user: JwtUser, createOrderDto: CreateOrderDto) {
    const {
      customerId,
      vendorOrders,
      deliveryFee,
      deliveryAddress,
      contactPhone,
    } = createOrderDto;

    if (user.sub.toString() !== createOrderDto.customerId) {
      throw new BadRequestException({
        message: 'Invalid user. Mis-match',
        status: 400,
        success: false,
      });
    }

    if (!vendorOrders || vendorOrders.length === 0) {
      throw new BadRequestException({
        message: 'Cart is empty',
        success: false,
        status: 400,
      });
    }

    let globalSubtotal = 0;

    const processedVendorOrders: CreateVendorOrderDto[] = [];

    for (const vendorOrder of vendorOrders) {
      let vendorSubtotal = 0;

      const processedItems: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
      }[] = [];

      for (const item of vendorOrder.items) {
        const product = await this.productsRepository.findById(item.productId);

        if (!product) {
          throw new NotFoundException({
            message: `Product not found: ${item.productId}`,
            success: false,
            status: 404,
          });
        }

        const price = product.price * item.quantity;

        vendorSubtotal += price;

        processedItems.push({
          productId: product._id.toString(),
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });
      }

      globalSubtotal += vendorSubtotal;

      processedVendorOrders.push({
        vendorId: vendorOrder.vendorId,
        items: processedItems,
        subtotal: vendorSubtotal,
        status: VendorOrderStatus.pending,
      });
    }

    const total = globalSubtotal + deliveryFee;

    const orderPayload = {
      customerId,
      vendorOrders: processedVendorOrders,
      subtotal: globalSubtotal,
      deliveryFee,
      total,
      deliveryAddress,
      contactPhone,
      status: OrderStatus.pending,
      isPaid: false,
    };

    const order = await this.orderRepository.createOrder(orderPayload);

    if (!order) {
      throw new BadRequestException({
        message: 'Order creation failed',
        success: false,
        status: 400,
      });
    }

    return order;
  }
}
