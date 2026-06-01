import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessShippingRateRepository } from '../business-shipping-rate/repositories/business-shipping-rate.repository';
import { ProductsRepository } from '../products/repositories/product.repository';
import { GetBuyerProductsDto } from './dtos/get-buyer-products.dto';

@Injectable()
export class BuyersService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly businessShippingRateRepository: BusinessShippingRateRepository,
  ) {}

  async getBuyerProducts(getBuyerProductsDto: GetBuyerProductsDto) {
    const { feed = 'recommended', page = 1, limit = 10 } = getBuyerProductsDto;

    const response = await this.productsRepository.getBuyerProducts({
      ...getBuyerProductsDto,
      feed,
      page: Number(page),
      limit: Number(limit),
    });

    return response;
  }

  async getBuyerProductDetails(productId: string) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    return product;
  }
}
