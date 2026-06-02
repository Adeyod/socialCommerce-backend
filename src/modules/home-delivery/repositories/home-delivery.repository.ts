import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
import { CreateHomeDeliveryFeeDto } from '../dtos/create-home-delivery.dto';
import {
  HomeDeliveryFee,
  HomeDeliveryFeeDocument,
} from '../schemas/home-delivery.schema';

@Injectable()
export class HomeDeliveryRepository {
  constructor(
    @InjectModel(HomeDeliveryFee.name)
    private readonly homeDeliveryModel: Model<HomeDeliveryFeeDocument>,
  ) {}

  async createHomeDeliveryFee(
    dto: CreateHomeDeliveryFeeDto,
  ): Promise<HomeDeliveryFeeDocument | null> {
    const id = new Types.ObjectId(dto.pickupCenterId);

    const response = await new this.homeDeliveryModel({
      buyerState: dto.buyerState,
      buyerTown: dto.buyerTown.trim().toLowerCase(),
      nearestBusStop: dto.nearestBusStop.trim().toLowerCase(),
      pickupCenterId: id,
      weightRanges: dto.weightRanges.map((w) => ({
        min: w.min,
        max: w.max,
        price: w.price,
      })),
    }).save();

    return response;
  }

  async findHomeDeliveryFeeUsingStateAndNearestBusStop(
    buyerState: NigeriaState,
    nearestBusStop: string,
  ): Promise<HomeDeliveryFeeDocument | null> {
    const response = await this.homeDeliveryModel
      .findOne({
        buyerState,
        nearestBusStop: nearestBusStop.trim().toLowerCase(),
      })
      .lean();

    return response;
  }
  async findHomeDeliveryFeeUsingPickupIdStateAndNearestBusStop(
    pickupCenterId: string,
    buyerState: NigeriaState,
    nearestBusStop: string,
  ): Promise<HomeDeliveryFeeDocument | null> {
    const id = new Types.ObjectId(pickupCenterId);

    const response = await this.homeDeliveryModel
      .findOne({
        pickupCenterId: id,
        buyerState,
        nearestBusStop: nearestBusStop.trim().toLowerCase(),
      })
      .lean();

    return response;
  }

  async getAllHomeDeliveryFees(queryWithPaginationDto: QueryWithPaginationDto) {
    const { page = 1, limit = 10, searchParams } = queryWithPaginationDto;

    const skip = (page - 1) * limit;

    let query = this.homeDeliveryModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { buyerState: { $regex: regex } },
          { buyerTown: { $regex: regex } },
          { nearestBusStop: { $regex: regex } },
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

    const fees = await query.sort({ createdAt: -1 }).exec();

    return fees;
  }

  async getHomeDeliveryFeesToBuyerNearestBusStop(
    pickupCenterId: string,
    buyerTown: string,
    nearestBusStop: string,
  ) {
    const id = new Types.ObjectId(pickupCenterId);

    const rates = await this.homeDeliveryModel.findOne({
      pickupCenterId: id,
      buyerTown,
      nearestBusStop,
    });

    return rates;
  }
}
