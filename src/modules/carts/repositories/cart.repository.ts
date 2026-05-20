import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../schemas/cart.schema';

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async getOrCreateCart(userId: string): Promise<CartDocument> {
    const id = new Types.ObjectId(userId);
    let cart = await this.cartModel.findOne({ userId: id });

    if (!cart) {
      cart = await new this.cartModel({
        userId: id,
        items: [],
      }).save();
    }

    return cart;
  }

  async getCart(userId: string): Promise<CartDocument | null> {
    const id = new Types.ObjectId(userId);
    const cart = await this.cartModel.findOne({ userId: id });

    return cart;
  }

  async addItem(
    userId: string,
    productId: string,
    businessId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    const productObjectId = new Types.ObjectId(productId);

    const existingItem = cart?.items.find(
      (item) => item.productId.toString() === productObjectId.toString(),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart?.items.push({
        productId: productObjectId,
        businessId: new Types.ObjectId(businessId),
        quantity,
      });
    }

    return cart.save();
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    const item = cart?.items.find((i) => i.productId.toString() === productId);

    if (!item) {
      return cart;
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (i) => i.productId.toString() !== productId,
      );
    } else {
      item.quantity = quantity;
    }

    return cart.save();
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);

    return cart.save();
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = [];

    return cart.save();
  }
}
