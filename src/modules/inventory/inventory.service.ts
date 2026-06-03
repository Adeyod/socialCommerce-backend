import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ProductsRepository } from '../products/repositories/product.repository';
import { AddStockDto } from './dtos/add-stock.dto';
import { AdjustStockDto } from './dtos/adjust-stock.dto';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryLogType } from './schemas/inventory-log.schema';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsRepository: ProductsRepository,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async addStock(dto: AddStockDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const inventory = await this.inventoryRepository.upsertInventory(
        dto.productId,
        dto.businessId,
        dto.quantity,
        session,
      );

      if (!inventory) {
        throw new BadRequestException({
          message: 'Unable to create inventory.',
          success: false,
          status: 400,
        });
      }

      const updateProduct =
        await this.productsRepository.productUpdateForInventory(
          dto.productId,
          dto.quantity,
          session,
        );

      if (!updateProduct) {
        throw new BadRequestException({
          message: 'Unable to update product when adding stock.',
          success: false,
          status: 400,
        });
      }

      const log = await this.inventoryRepository.createLog(
        {
          productId: new Types.ObjectId(dto.productId),
          businessId: new Types.ObjectId(dto.businessId),
          type: InventoryLogType.restock,
          quantity: dto.quantity,
          newQuantity: inventory.quantity,
        },
        session,
      );

      if (!log) {
        throw new BadRequestException({
          message: 'Unable to create inventory log during adding of stock',
          success: false,
          status: 400,
        });
      }

      await session.commitTransaction();
      return inventory;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  async adjustStock(dto: AdjustStockDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const inventory = await this.inventoryRepository.findInventory(
        dto.productId,
        dto.businessId,
      );

      if (!inventory) {
        throw new NotFoundException({
          message: 'Inventory not found.',
          success: false,
          status: 404,
        });
      }

      const newQuantity = inventory.quantity + dto.quantity;

      if (newQuantity < 0) {
        throw new BadRequestException({
          message: 'Stock cannot be negative.',
          success: false,
          status: 400,
        });
      }

      const updated = await this.inventoryRepository.updateInventoryQuantity(
        dto.productId,
        dto.businessId,
        dto.quantity,
        session,
      );

      if (!updated) {
        throw new BadRequestException({
          message: 'Unable to update inventory.',
          success: false,
          status: 400,
        });
      }

      const productUpdate =
        await this.productsRepository.productUpdateForInventory(
          dto.productId,
          dto.quantity,
          session,
        );

      if (!productUpdate) {
        throw new BadRequestException({
          message: 'Unable to update product when adjusting stock.',
          success: false,
          status: 400,
        });
      }

      const payload = {
        productId: new Types.ObjectId(dto.productId),
        businessId: new Types.ObjectId(dto.businessId),
        type: InventoryLogType.adjustment,
        quantity: dto.quantity,
        previousQuantity: inventory.quantity,
        newQuantity: updated.quantity,
        reference: dto.reason,
      };

      const log = await this.inventoryRepository.createLog(payload, session);

      if (!log) {
        throw new BadRequestException({
          message: 'Unable to create log when adjusting stock inventory.',
          success: false,
          status: 400,
        });
      }

      await session.commitTransaction();

      return updated;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }
}
