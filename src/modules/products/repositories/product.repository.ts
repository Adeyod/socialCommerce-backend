import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async createProduct(data) {
    const newProduct = await new this.productModel({
      name: data.name,
      businessId: data.businessId,
      description: data.description && data.description,
      price: data.price,
      media: [
        {
          url: data.media.url,
          publicUrl: data.media.publicUrl,
        },
      ],
      stock: data.stock,
      category: data.category,
      tags: data.tags,
      sku: data.sku,
    }).save();

    return newProduct;
  }

  async findById(id: string) {
    const productId = new Types.ObjectId(id);

    const product = await this.productModel.findById(productId);

    return product;
  }

  async findByBusinessId(businessId: string) {
    const id = new Types.ObjectId(businessId);
    const product = await this.productModel.findOne({ businessId: id });

    return product;
  }

  async updateProduct(productId: string, data: Partial<Product>) {
    const id = new Types.ObjectId(productId);

    const updatedProduct = await this.productModel.findByIdAndUpdate(id, data, {
      new: true,
    });

    return updatedProduct;
  }

  async deleteProduct(productId: string) {
    const id = new Types.ObjectId(productId);
    const product = await this.productModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
    });

    return product;
  }
}
