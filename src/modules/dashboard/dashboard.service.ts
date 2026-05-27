import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CartRepository } from '../carts/repositories/cart.repository';
import { OrderRepository } from '../orders/repositories/order.repository';
import { ProductsRepository } from '../products/repositories/product.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async getBuyerDashboard(user: JwtUser) {
    const userId = user.sub.toString();

    const [orderData, cart, products] = await Promise.all([
      this.orderRepository.getBuyerOrderStats(userId),
      this.cartRepository.getCartSummary(userId),
      this.productsRepository.getRandomProducts(5),
    ]);

    const stats = orderData[0]?.stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    return {
      stats: {
        cartItems: cart?.items?.length || 0,
        pendingOrders: stats.pendingOrders,
        completedOrders: stats.completedOrders,
        totalOrders: stats.totalOrders,
      },
      recentOrders: orderData[0]?.recentOrders || [],
      products,
      cart: {
        itemsCount: cart?.items?.length || 0,
      },
    };
  }
  async getVendorDashboard(user: JwtUser) {
    const userId = user.sub.toString();

    const business =
      await this.businessesRepository.findBusinessWithUserId(userId);

    if (!business) {
      throw new NotFoundException({
        message: 'Business not found',
        status: 404,
        success: false,
      });
    }

    const businessId = business._id;

    const [orderData, productCount] = await Promise.all([
      this.orderRepository.getBusinessStats(businessId.toString()),
      this.productsRepository.countByBusiness(businessId.toString()),
    ]);

    const stats = orderData[0]?.stats[0] || {
      orders: 0,
      revenue: 0,
    };

    return {
      revenue: stats.revenue,
      orders: stats.orders,
      products: productCount,
      recentOrders: orderData[0]?.recentOrders || [],
      store: {
        businessId,
        businessName: business.businessName,
        // storeImage: business.storeImage,
        // shareUrl: `/viral-feed?ref=${businessId}`,
      },
    };
  }
}
