import { Injectable, NotFoundException } from '@nestjs/common';
import { AddItemToCartDto } from './dtos/add-item.dto';
import { CartRepository } from './repositories/cart.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(userId: string) {
    const cart = await this.cartRepository.getCart(userId);

    if (!cart) {
      throw new NotFoundException({
        message: 'Cart not found.',
        success: false,
        status: 404,
      });
    }

    return cart;
  }

  async getOrCreateCart(userId: string) {
    const cart = await this.cartRepository.getOrCreateCart(userId);

    if (!cart) {
      throw new NotFoundException({
        message: 'Cart not found.',
        success: false,
        status: 404,
      });
    }

    return cart;
  }

  async addItem(userId: string, addItemToCartDto: AddItemToCartDto) {
    const { productId, businessId, quantity } = addItemToCartDto;

    const cart = await this.cartRepository.addItem(
      userId,
      productId,
      businessId,
      quantity,
    );

    if (!cart) {
      throw new NotFoundException({
        message: 'Unable to add item to cart',
        success: false,
        status: 404,
      });
    }

    return cart;
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    const cart = await this.cartRepository.updateItemQuantity(
      userId,
      productId,
      quantity,
    );

    if (!cart) {
      throw new NotFoundException({
        message: 'Cart item not found',
        success: false,
        status: 404,
      });
    }

    return cart;
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.cartRepository.removeItem(userId, productId);

    return cart;
  }

  async clearCart(userId: string) {
    return await this.cartRepository.clearCart(userId);
  }
}
