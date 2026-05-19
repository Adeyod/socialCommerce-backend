import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post('create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Order created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Order',
    description: 'This is the endpoint that user will use to create order.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create order.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.createOrder(user, createOrderDto);

    return response;
  }

  @Get('customer-orders/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Orders fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get orders of a customer.',
    description:
      'This is the endpoint for getting the orders of logged in customer. Logged in user and admin can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch orders.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getCustomerOrders(
      customerId,
      user,
      queryWithPaginationDto,
    );

    return response;
  }
  @Get('customer-orders/:orderId/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Order details fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get order details of a customer.',
    description:
      'This is the endpoint for getting the order details of logged in customer. Logged in user and admin can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch orders.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCustomerOrderDetails(
    @Param('customerId') customerId: string,
    @Param('orderId') orderId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getCustomerOrderDetails(
      customerId,
      orderId,
      user,
    );

    return response;
  }

  @Get('vendor/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.view_order)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Orders fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vendor orders.',
    description: 'This is the endpoint for getting the orders of a vendor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch orders.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorOrdersByBusinessId(
    @Param('businessId') businessId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getVendorOrdersByBusinessId(
      businessId,
      queryWithPaginationDto,
      user,
    );

    return response;
  }
}
