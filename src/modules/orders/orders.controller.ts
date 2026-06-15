import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
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
import { BulkSendToPickupDto } from '../vendor/dtos/bulk-send-to-pickup.dto';
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
    @Req() req: Request,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.createOrder(user, createOrderDto);

    return response;
  }

  @Get('buyer-orders/:buyerId')
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
    @Param('buyerId') buyerId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getCustomerOrders(
      buyerId,
      user,
      queryWithPaginationDto,
    );

    return response;
  }
  @Get('buyer-order/:buyerId/:orderId')
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
    @Param('buyerId') buyerId: string,
    @Param('orderId') orderId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getCustomerOrderDetails(
      buyerId,
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

  @Get('vendor/:businessId/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.view_order)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Order details fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vendor order details.',
    description:
      'This is the endpoint for getting the details of an order of a vendor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch orders details.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorSingleOrderByBusinessIdAndOrderId(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.ordersService.getVendorSingleOrderByBusinessIdAndOrderId(
        businessId,
        orderId,
        user,
      );

    return response;
  }

  @Get('business-orders-to-fulfil/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.get_order_for_fulfilment)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Orders for fulfilment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Order fulfilment',
    description:
      'This is the endpoint that a business uses to fetch all orders that buyers have paid for that has not being sent to the pickup center.',
  })
  @ApiResponse({
    status: 201,
    description: 'Orders for fulfilment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to get orders for fulfilment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorBusinessOrdersToFulfill(
    @Param('businessId') businessId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.getVendorBusinessOrdersToFulfill(
      businessId,
      user,
      queryWithPaginationDto,
    );

    return response;
  }

  @Post('send-multiple-orders-to-pickup-center/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.send_order_to_pickup_center)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Orders sent to pickup centers successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Orders to pickup centers',
    description:
      'This is the endpoint that a business uses to fetch all orders that buyers have paid for that has not being sent to the pickup center.',
  })
  @ApiResponse({
    status: 201,
    description: 'Orders sent to pickup centers successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to send orders to pickup centers.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendMultipleOrderToPickup(
    @Body() dto: BulkSendToPickupDto,
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.sendMultipleOrderToPickup(
      dto.orderIds,
      businessId,
      user,
    );

    return response;
  }

  @Post('send-single-order-to-pickup/:businessId/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.send_order_to_pickup_center)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Order sent to pickup center successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Order fulfilment',
    description:
      'This is the endpoint that a business uses to send single order to pickup center.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order sent to pickup center successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to send order to pickup center.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendSingleOrderToPickup(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.ordersService.sendSingleOrderToPickup(
      businessId,
      orderId,
      user,
    );

    return response;
  }

  @Get('business-single-order-to-fulfil/:businessId/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.get_order_for_fulfilment)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Order details for fulfilment fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Order fulfilment details',
    description:
      'This is the endpoint that a business uses to fetch details of order that buyers have paid for that has not being sent to the pickup center.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order details for fulfilment fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to get order details for fulfilment.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getVendorBusinessSingleOrderDetailsForFulfilment(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response =
      await this.ordersService.getVendorBusinessSingleOrderDetailsForFulfilment(
        businessId,
        orderId,
        user,
      );

    return response;
  }

  @Get('get-pending-pickup-center-orders/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center orders fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Pick up center orders',
    description: 'This is the endpoint for fetching pick up center orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center orders fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center orders.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getOrdersForPickupCenter(
    @Param('pickupCenterId') pickupCenterId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.ordersService.getOrdersForPickupCenter(
      pickupCenterId,
      queryWithPaginationDto,
    );

    return response;
  }

  @Get('get-pending-pickup-center-orders/:pickupCenterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center orders fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Pick up center orders',
    description: 'This is the endpoint for fetching pick up center orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center orders fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch pick up center orders.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getPendingPickupCenterItems(
    @Param('pickupCenterId') pickupCenterId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.ordersService.getPendingPickupCenterItems(
      pickupCenterId,
      queryWithPaginationDto,
    );

    return response;
  }

  @Post(
    'mark-item-as-received-at-pickup-center/:pickupCenterId/:businessId/:orderId/:productId',
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Pick up center mark item as received successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark item as received at pickup center.',
    description:
      'This is the endpoint for pick up center to mark item(product) as received.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pick up center mark item as received successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to mark product as received.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async markItemAsReceivedAtPickupCenter(
    @Param('pickupCenterId') pickupCenterId: string,
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
  ) {
    const response = await this.ordersService.markItemAsReceivedAtPickupCenter(
      pickupCenterId,
      businessId,
      orderId,
      productId,
    );

    return response;
  }
}
