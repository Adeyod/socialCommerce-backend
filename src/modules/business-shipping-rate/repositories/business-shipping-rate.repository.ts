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
    const priceBreakdown = dto.priceBreakdown.map((p) => {
      return {
        destinationState: p.destinationState.trim().toLowerCase(),
        weightRanges: p.weightRanges.map((w) => ({
          min: w.min,
          max: w.max,
          price: w.price,
        })),
      };
    });

    const rate = await new this.businessShippingRateModel({
      businessId: new Types.ObjectId(dto.businessId),
      originState: dto.originState.trim().toLowerCase(),
      priceBreakdown: priceBreakdown,
    }).save();

    return rate;
  }

  async findBusinessShippingRate(
    businessId: string,
  ): Promise<BusinessShippingRateDocument | null> {
    const id = new Types.ObjectId(businessId);

    const rate = await this.businessShippingRateModel
      .findOne({
        businessId: id,
      })
      .lean();

    console.log('rate:', rate);

    return rate;
  }
}
