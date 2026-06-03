import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { AddStockDto } from './dtos/add-stock.dto';
import { AdjustStockDto } from './dtos/adjust-stock.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('add-stock')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.add_stock)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Inventory updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add stock to inventory stock',
    description:
      'This is the endpoint that vendor/business will use to add stock to its existing product stock.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product stock added successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to add stock for this product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async addStock(@Body() dto: AddStockDto) {
    const result = await this.inventoryService.addStock(dto);

    return result;
  }

  @Post('adjust-stock')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.adjust_stock)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Inventory adjusted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust product stock',
    description:
      'This is the endpoint that vendor/business will use to adjust stock to its existing product stock.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product stock adjusted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to adjust product stock.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async adjustStock(@Body() dto: AdjustStockDto) {
    const result = await this.inventoryService.adjustStock(dto);

    return result;
  }
}
