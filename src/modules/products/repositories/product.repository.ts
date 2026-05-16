import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async createProduct(data: {
    name: string;
    description?: string;
    sku: string;
    category?: string;
    tags?: string[];
    price: number;
    stock: number;
    media: {
      url: string;
      publicUrl: string;
    }[];
    businessId: string;
    inStock: boolean;
  }) {
    const newProduct = await new this.productModel({
      name: data.name.toLowerCase(),
      businessId: new Types.ObjectId(data.businessId),
      description: data.description?.toLowerCase(),
      price: data.price,
      media: data.media,
      stock: data.stock,
      category: data.category?.toLowerCase(),
      tags: data.tags,
      sku: data.sku.toLowerCase(),
    }).save();

    return newProduct;
  }

  async findById(id: string) {
    const productId = new Types.ObjectId(id);

    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
    });

    return product;
  }

  async findAProductByBusinessId(businessId: string, productId: string) {
    const id = new Types.ObjectId(businessId);
    const prodId = new Types.ObjectId(productId);
    const product = await this.productModel.findOne({
      _id: prodId,
      businessId: id,
      isDeleted: false,
      isActive: true,
    });

    return product;
  }
  async findProductsByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    products: ProductDocument[];
    totalCount: number;
    totalPages: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(businessId);

    let query = this.productModel.find({
      businessId: id,
      isDeleted: false,
      isActive: true,
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { name: { $regex: regex } },
          { description: { $regex: regex } },
          { category: { $regex: regex } },
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }
    const products = await query.sort({ createdAt: -1 });

    if (products.length === 0) {
      throw new NotFoundException({
        message: 'Products not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      products,
      totalCount: count,
      totalPages: pages,
    };

    return response;
  }

  async updateProduct(productId: string, data: Partial<Product>) {
    const id = new Types.ObjectId(productId);

    const updatedProduct = await this.productModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
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
