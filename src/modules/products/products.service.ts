import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { CloudinaryService } from '../../common/infrastructure/cloudinary/cloudinary.service';
import { CloudinaryResponse } from '../../common/infrastructure/cloudinary/cloudinary.types';
import { JwtUser } from '../../common/types/jwt-user.type';
import { buildSmartPatch } from '../../common/utils/helper';
import { BusinessShippingRateRepository } from '../business-shipping-rate/repositories/business-shipping-rate.repository';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { InventoryRepository } from '../inventory/repositories/inventory.repository';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsRepository } from './repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly businessesRepository: BusinessesRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly businessShippingRateRepository: BusinessShippingRateRepository,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createProduct(
    businessId: string,
    user: JwtUser,
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    const id = new Types.ObjectId(businessId);

    console.log('createProductDto:', createProductDto);

    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!businessExist) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    if (!businessExist.isVerified) {
      throw new ForbiddenException({
        message: 'Only verified business can create product.',
        success: false,
        status: 403,
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
      files,
      'Social-Commerce',
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const data = {
        ...createProductDto,
        media: uploadMedias,
        businessId: businessExist._id.toString(),
        inStock: (createProductDto.stock ?? 0) > 0,
        sku: this.generateSku(),
      };
      const product = await this.productsRepository.createProduct(data);

      if (!product) {
        throw new BadRequestException({
          message: 'Unable to create product.',
          success: false,
          status: 400,
        });
      }

      const inventory = await this.inventoryRepository.createInventory(
        businessId,
        product._id.toString(),
        createProductDto.stock,
        session,
      );

      if (!inventory) {
        throw new BadRequestException({
          message: 'Unable to create inventory when creating product.',
          success: false,
          status: 400,
        });
      }

      console.log('product:', product);
      return {
        message: 'Product created successfully.',
        data: product,
      };
    } catch (error) {
      await session.abortTransaction();

      const payload = uploadMedias.map((img) => img.publicUrl);

      await this.cloudinaryService.deleteMultiple(payload); // important

      throw error;
    } finally {
      session.endSession();
    }
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

  async getAProductByBusinessId(businessId: string, productId: string) {
    const product = await this.productsRepository.findAProductByBusinessId(
      businessId,
      productId,
    );

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
  async getProductsByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const product = await this.productsRepository.findProductsByBusinessId(
      businessId,
      queryWithPaginationDto,
    );

    if (!product) {
      throw new NotFoundException({
        message: 'Products not found.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Products fetched successfully.',
      data: product,
    };
  }

  async updateProduct(
    productId: string,
    updateProductDto: UpdateProductDto,
    user: JwtUser,
    businessId: string,
    files: Express.Multer.File[] | undefined,
  ) {
    console.log('updateProductDto:', updateProductDto);
    console.log('files:', files);

    if (!user.businessId) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const id = new Types.ObjectId(businessId);

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

    if (!productExist) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    if (productExist.businessId.toString() !== business._id.toString()) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const images = productExist.media.map((img) => img.publicUrl);

    let newMedia: CloudinaryResponse[] = [];

    if (files && files.length > 0 && images.length > 0) {
      const deleteImages = await this.cloudinaryService.delete(images);

      const uploadMedias = await this.cloudinaryService.uploadMany(
        files,
        'Social-Commerce',
      );

      newMedia = uploadMedias;
    }

    const rawData = {
      ...updateProductDto,
      ...(newMedia.length > 0 && { media: newMedia }),
      ...(updateProductDto.stock !== undefined && {
        inStock: updateProductDto.stock > 0,
      }),
    };

    // const data = Object.fromEntries(
    //   Object.entries(rawData).filter(([_, value]) => value !== undefined),
    // );

    const data = buildSmartPatch(rawData);

    const product = await this.productsRepository.updateProduct(
      productId,
      data,
    );

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }

    console.log('product.businessId:', product.businessId);
    console.log('business._id:', business._id);

    return {
      message: 'Product updated successfully.',
      data: product,
    };
  }

  async deleteProductById(
    productId: string,
    user: JwtUser,
    businessId: string,
  ) {
    if (!user.businessId) {
      throw new ForbiddenException({
        message: 'You are not allowed to update this product.',
        success: false,
        status: 403,
      });
    }

    const id = new Types.ObjectId(businessId);

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

    if (
      productExist &&
      productExist.businessId.toString() !== business._id.toString()
    ) {
      throw new ForbiddenException({
        message: 'This Product has business mis-match.',
        success: false,
        status: 403,
      });
    }

    const product = await this.productsRepository.deleteProduct(productId);

    if (!product) {
      throw new NotFoundException({
        message: 'Unable to delete Product.',
        success: false,
        status: 404,
      });
    }

    return {
      message: 'Product deleted successfully.',
    };
  }

  private generateSku(): string {
    return `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
