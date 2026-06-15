import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { ProductsRepository } from '../products/repositories/product.repository';
import { AddItemToCartDto } from './dtos/add-item.dto';
import { CartRepository } from './repositories/cart.repository';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

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

    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(
        new Types.ObjectId(businessId),
      );

    if (!businessExist) {
      throw new NotFoundException({
        message: 'Business that owns this product not found.',
        success: false,
        status: 404,
      });
    }

    if (
      !businessExist.businessAddress ||
      !businessExist.businessAddress.state ||
      !businessExist.businessAddress.town
    ) {
      throw new BadRequestException({
        message: 'This business does not have business address.',
        status: 400,
        success: false,
      });
    }
    const productExist = await this.productsRepository.findAProductByBusinessId(
      businessId,
      productId,
    );

    if (!productExist) {
      throw new NotFoundException({
        message: `Product with ID: ${productId} not found.`,
        success: false,
        status: 404,
      });
    }

    if (productExist.stock < quantity) {
      throw new BadRequestException({
        message: `This store has ${productExist.stock} ${productExist.name} left.`,
        success: false,
        status: 400,
      });
    }

    const weight = productExist.weight || 1;

    const cart = await this.cartRepository.addItem(
      userId,
      productId,
      productExist.name,
      productExist.price,
      businessExist.businessAddress.state,
      businessExist.businessAddress?.town,
      productExist.media,
      weight,
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
