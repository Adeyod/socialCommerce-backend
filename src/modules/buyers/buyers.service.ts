import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '../products/repositories/product.repository';
import { GetBuyerProductsDto } from './dtos/get-buyer-products.dto';

@Injectable()
export class BuyersService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getBuyerProducts(getBuyerProductsDto: GetBuyerProductsDto) {
    const { feed = 'recommended', page = 1, limit = 10 } = getBuyerProductsDto;

    const response = await this.productsRepository.getBuyerProducts({
      ...getBuyerProductsDto,
      feed,
      page: Number(page),
      limit: Number(limit),
    });

    console.log('response:', response);
    return response;
  }
}
