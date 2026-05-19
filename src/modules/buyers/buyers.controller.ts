import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BuyersService } from './buyers.service';
import { GetBuyerProductsDto } from './dtos/get-buyer-products.dto';

@Controller('buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get('products')
  @SuccessMessage('Products fetched successfully.')
  @ApiOperation({
    summary: 'Get products.',
    description:
      'This is the endpoint to fetch products to be displayed on marketplace for buyers to make purchase.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch products.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getByerProducts(@Query() getBuyerProductsDto: GetBuyerProductsDto) {
    const response =
      await this.buyersService.getBuyerProducts(getBuyerProductsDto);

    return response;
  }

  @Get('products/:productId')
  @SuccessMessage('Product details fetched successfully.')
  @ApiOperation({
    summary: 'Get product details',
    description:
      'This is the endpoint for getting the details of a particular product for the buyer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch product details.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getBuyerProductDetails(@Param('productId') productId: string) {
    const response = await this.buyersService.getBuyerProductDetails(productId);
    return response;
  }
}
