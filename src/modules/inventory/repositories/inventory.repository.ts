import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  InventoryLog,
  InventoryLogDocument,
} from '../schemas/inventory-log.schema';
import { Inventory, InventoryDocument } from '../schemas/inventory.schema';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,

    @InjectModel(InventoryLog.name)
    private readonly inventoryLogModel: Model<InventoryLogDocument>,
  ) {}

  async findManyByProductIds(productIds: string[], session?: ClientSession) {
    const objectIds = productIds.map((id) => new Types.ObjectId(id));

    const response = await this.inventoryModel.find(
      {
        productId: { $in: objectIds },
      },
      { session },
    );

    return response;
  }
  async findInventoryByProductId(productId: string, session?: ClientSession) {
    const response = await this.inventoryModel.findOne(
      {
        productId: new Types.ObjectId(productId),
      },
      { session },
    );

    return response;
  }
  async findInventory(productId: string, businessId: string) {
    const response = await this.inventoryModel.findOne({
      productId: new Types.ObjectId(productId),
      businessId: new Types.ObjectId(businessId),
    });

    return response;
  }

  async upsertInventory(
    productId: string,
    businessId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    const response = await this.inventoryModel.findOneAndUpdate(
      {
        productId: new Types.ObjectId(productId),
        businessId: new Types.ObjectId(businessId),
      },
      {
        $inc: { quantity },
        $setOnInsert: {
          productId: new Types.ObjectId(productId),
          businessId: new Types.ObjectId(businessId),
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        session,
      },
    );

    return response;
  }

  async updateInventoryQuantity(
    productId: string,
    businessId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    const response = await this.inventoryModel.findOneAndUpdate(
      {
        productId: new Types.ObjectId(productId),
        businessId: new Types.ObjectId(businessId),
      },
      {
        $inc: { quantity },
      },
      {
        returnDocument: 'after',
        session,
      },
    );

    return response;
  }

  async createLog(log: Partial<InventoryLogDocument>, session?: ClientSession) {
    const response = new this.inventoryLogModel(log);
    const result = await response.save({ session });

    return result;
  }

  async createLogsBulk(
    logs: Partial<InventoryLogDocument>[],
    session: ClientSession,
  ) {
    return this.inventoryLogModel.insertMany(logs, { session });
  }

  async createInventory(
    businessId: string,
    productId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    const response = await new this.inventoryModel({
      productId: new Types.ObjectId(productId),
      businessId: new Types.ObjectId(businessId),
      quantity: quantity,
    }).save({ session });

    return response;
  }

  async reserveStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    console.log('productId:', productId);

    const result = await this.inventoryModel.updateOne(
      {
        productId: new Types.ObjectId(productId),
        quantity: { $gte: quantity },
      },
      {
        $inc: {
          quantity: -quantity,
          reservedQuantity: quantity,
        },
      },
      { session },
    );

    console.log('result:', result);
    console.log('result.matchedCount:', result.matchedCount);

    if (result.matchedCount === 0) {
      throw new BadRequestException({
        message: `Insufficient stock for product ${productId}`,
        success: false,
        status: 400,
      });
    }

    return result;
  }

  async decrementInventoryBulk(
    updates: { productId: string; quantity: number }[],
    session: ClientSession,
  ) {
    const ops = updates.map((item) => ({
      updateOne: {
        filter: { productId: new Types.ObjectId(item.productId) },
        update: {
          $inc: {
            quantity: -item.quantity,
            reservedQuantity: -item.quantity,
          },
        },
      },
    }));

    return this.inventoryModel.bulkWrite(ops, { session });
  }
}
