import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create-product/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Product',
    description:
      'This is the endpoint that a vendor will use to create product that he want to sell.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createProduct(
    @Param('businessId') businessId: string,
    @Body() createProductDto: CreateProductDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.productsService.createProduct(
      businessId,
      user,
      createProductDto,
    );

    console.log('response:', response);
    return response;
  }

  @Get('get-product-by-productId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch product endpoint.',
    description: 'This is the endpoint for fetching a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProductByProductId(@Param('productId') productId: string) {
    const response =
      await this.productsService.getProductByProductId(productId);

    console.log('response:', response);
    return response;
  }

  @Get('get-product-by-businessId/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch product endpoint.',
    description: 'This is the endpoint for fetching a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProductByBusinessId(@Param('businessId') businessId: string) {
    const response =
      await this.productsService.getProductByBusinessId(businessId);

    console.log('response:', response);
    return response;
  }

  @Patch('update-product-by-productId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.update_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update product endpoint.',
    description: 'This is the endpoint for updating a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateProductByProductId(
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.productsService.updateProduct(
      productId,
      updateProductDto,
      user,
    );

    console.log('response:', response);
    return response;
  }

  @Delete('delete-product-by-productId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.delete_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete product endpoint.',
    description: 'This is the endpoint for deleting a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to delete product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteProductById(
    @Param('productId') productId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.productsService.deleteProductById(
      productId,
      user,
    );

    console.log('response:', response);
    return response;
  }
}
