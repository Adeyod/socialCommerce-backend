import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBusinessShippingRateDto } from '../dtos/business-shipping-rate.dto';
import {
  BusinessShippingRate,
  BusinessShippingRateDocument,
} from '../schemas/business-shipping-rate.schema';

@Injectable()
export class BusinessShippingRateRepository {
  constructor(
    @InjectModel(BusinessShippingRate.name)
    private readonly businessShippingRateModel: Model<BusinessShippingRateDocument>,
  ) {}

  async createBusinessShippingRate(
    dto: CreateBusinessShippingRateDto,
  ): Promise<BusinessShippingRateDocument | null> {
    const rate = await new this.businessShippingRateModel(dto).save();

    return rate;
  }

  async findBusinessShippingRate(
    businessId: string,
  ): Promise<BusinessShippingRateDocument | null> {
    const id = new Types.ObjectId(businessId);

    const rate = await this.businessShippingRateModel.findOne({
      businessId: id,
    });

    return rate;
  }
}
