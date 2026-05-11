import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CloudinaryService } from '../../common/infrastructure/cloudinary/cloudinary.service';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsRepository } from './repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async createProduct(
    businessId: string,
    user: JwtUser,
    createProductDto: CreateProductDto,
  ) {
    const id = new Types.ObjectId(businessId);

    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!businessExist) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    if (user.sub.toString() !== businessExist.ownerId.toString()) {
      throw new ForbiddenException({
        message: 'You are not allowed to create product for this business.',
        success: false,
        status: 403,
      });
    }

    const uploadMedias = await this.cloudinaryService.uploadMany(
      createProductDto.images,
      'Social-Commerce',
    );

    const data = {
      ...createProductDto,
      media: uploadMedias,
      businessId: businessExist._id.toString(),
      inStock: (createProductDto.stock ?? 0) > 0,
    };
    const product = await this.productsRepository.createProduct(data);

    console.log('product:', product);
    return {
      message: 'Product created successfully.',
      data: product,
    };
  }

  async getProductByProductId(productId: string) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Product fetched successfully.',
      data: product,
    };
  }

  async getProductByBusinessId(businessId: string) {
    const product = await this.productsRepository.findByBusinessId(businessId);

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Product fetched successfully.',
      data: product,
    };
  }

  async updateProduct(
    productId: string,
    updateProductDto: UpdateProductDto,
    user: JwtUser,
  ) {
    if (!user.businessId) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const id = new Types.ObjectId(user?.businessId.toString());

    const business =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!business) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    const product = await this.productsRepository.updateProduct(productId, {
      ...updateProductDto,
      ...(updateProductDto.stock !== undefined && {
        inStock: updateProductDto.stock > 0,
      }),
    });

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    if (product.businessId !== business._id) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    return {
      message: 'Product updated successfully.',
      data: product,
    };
  }

  async deleteProductById(productId: string, user: JwtUser) {
    if (!user.businessId) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const id = new Types.ObjectId(user?.businessId.toString());

    const business =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!business) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    const productExist = await this.productsRepository.findById(productId);

    if (productExist && productExist.businessId !== business._id) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const product = await this.productsRepository.deleteProduct(productId);

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Product deleted successfully.',
    };
  }
}
