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
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { CartsService } from './carts.service';
import { AddItemToCartDto } from './dtos/add-item.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartService: CartsService) {}

  // Get user cart
  @Get('get-cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Cart fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cart of a buyer.',
    description: 'This is the endpoint to get the cart of a buyer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch cart.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCart(@GetCurrentUser() user: JwtUser) {
    return await this.cartService.getCart(user.sub.toString());
  }

  // Get or create cart (safe entry point for frontend)
  @Get('get-or-create-cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Cart fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cart of a buyer.',
    description: 'This is the endpoint to create or get the cart of a buyer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch cart.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getOrCreateCart(@GetCurrentUser() user: JwtUser) {
    return await this.cartService.getOrCreateCart(user.sub.toString());
  }

  // Add item to cart
  @Post('add-item-to-cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Item added to Cart successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add to cart.',
    description: 'This is the endpoint to add item to cart.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to add item to cart.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async addItem(
    @GetCurrentUser() user: JwtUser,
    @Body() addItemToCartDto: AddItemToCartDto,
  ) {
    return await this.cartService.addItem(
      user.sub.toString(),
      addItemToCartDto,
    );
  }

  // Update item quantity
  @Patch('update-item-quantity/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Item quantity updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add to cart.',
    description: 'This is the endpoint to update item quantity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update item quantity.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateQuantity(
    @GetCurrentUser() user: JwtUser,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return await this.cartService.updateItemQuantity(
      user.sub.toString(),
      productId,
      body.quantity,
    );
  }

  // Remove item
  @Delete('remove-item/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Item removed from Cart successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'remove from cart.',
    description: 'This is the endpoint to remove item to cart.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to remove item to cart.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async removeItem(
    @GetCurrentUser() user: JwtUser,
    @Param('productId') productId: string,
  ) {
    return await this.cartService.removeItem(user.sub.toString(), productId);
  }

  // Clear cart
  @Delete('clear-cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Cart cleared successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear cart.',
    description: 'This is the endpoint to clear cart.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to clear cart.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async clearCart(@GetCurrentUser() user: JwtUser) {
    return await this.cartService.clearCart(user.sub.toString());
  }
}
