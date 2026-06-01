import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
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
    const rate = await new this.businessShippingRateModel({
      businessId: new Types.ObjectId(dto.businessId),
      originState: dto.originState,
      destinationState: dto.destinationState,
      weightRanges: dto.weightRanges.map((w) => ({
        min: w.min,
        max: w.max,
        price: w.price,
      })),
    }).save();

    return rate;
  }

  async findByBusinessAndDestination(
    businessId: string,
    destinationState: NigeriaState,
  ): Promise<BusinessShippingRateDocument | null> {
    const id = new Types.ObjectId(businessId);

    const rates = await this.businessShippingRateModel.findOne({
      businessId: id,
      destinationState,
    });

    console.log('rates:', rates);

    return rates;
  }
  async findBusinessShippingRateForAllStates(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<BusinessShippingRateDocument[] | null> {
    const id = new Types.ObjectId(businessId);

    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    let query = this.businessShippingRateModel.find({ businessId: id });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { originState: { $regex: regex } },
          { destinationState: { $regex: regex } },
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
          message: 'Page can not be found',
          status: 404,
          success: false,
        });
      }
    }

    const rates = await query.sort({ createdAt: -1 }).exec();

    console.log('rates:', rates);

    return rates;
  }
  async findBusinessShippingRatePerDestinationState(
    businessId: string,
    destinationState: NigeriaState,
  ): Promise<BusinessShippingRateDocument | null> {
    const id = new Types.ObjectId(businessId);

    const rate = await this.businessShippingRateModel
      .findOne({
        businessId: id,
        destinationState,
      })
      .lean();

    console.log('rate:', rate);

    return rate;
  }
}
