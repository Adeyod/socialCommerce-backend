import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { ProductsRepository } from '../products/repositories/product.repository';
import { CreateCampaignDto } from './dtos/create-campaign.dto';
import { CampaignRepository } from './repositories/campaign.repository';
import { ProductCampaign } from './schemas/product-campaign-mapping.schema';

@Injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly productsRepository: ProductsRepository,

    @InjectModel(ProductCampaign.name)
    private readonly productCampaignModel: Model<ProductCampaign>,
  ) {}

  async createCampaign(businessId: string, dto: CreateCampaignDto) {
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
    const payload = {
      ...dto,
      rewardProductId: dto.rewardProductId
        ? new Types.ObjectId(dto.rewardProductId)
        : undefined,
      businessId: new Types.ObjectId(businessId),
    };
    const response = await this.campaignRepo.create(payload);

    return response;
  }

  async attachToProduct(productId: string, campaignId: string) {
    const productExist = await this.productsRepository.findById(productId);

    if (!productExist) {
      throw new NotFoundException({
        message: 'Product not found.',
        success: false,
        status: 404,
      });
    }
    const response = await new this.productCampaignModel({
      productId,
      campaignId,
    }).save();

    return response;
  }

  async getProductCampaigns(productId: string) {
    const response = await this.productCampaignModel
      .find({ productId })
      .populate('campaignId');
    return response;
  }

  async getBusinessCampaigns(businessId: string) {
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

    const response =
      await this.campaignRepo.findCampaignsByBusinessId(businessId);

    if (!response) {
      throw new NotFoundException({
        message: 'Business campaign not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
}
