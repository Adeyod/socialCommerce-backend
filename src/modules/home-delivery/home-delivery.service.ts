import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { CreateHomeDeliveryFeeDto } from './dtos/create-home-delivery.dto';
import { HomeDeliveryRepository } from './repositories/home-delivery.repository';

@Injectable()
export class HomeDeliveryService {
  constructor(
    private readonly homeDeliveryRepository: HomeDeliveryRepository,
  ) {}

  async createHomeDeliveryFee(dto: CreateHomeDeliveryFeeDto) {
    const homeDeliveryExist =
      await this.homeDeliveryRepository.findHomeDeliveryFeeUsingPickupIdStateAndNearestBusStop(
        dto.pickupCenterId,
        dto.state,
        dto.nearestBusStop,
      );

    if (homeDeliveryExist) {
      throw new ConflictException({
        message: `Home delivery fee has been created for ${dto.nearestBusStop} in ${dto.state} state.`,
        success: false,
        status: 409,
      });
    }

    const response =
      await this.homeDeliveryRepository.createHomeDeliveryFee(dto);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create home delivery fee.',
        status: 400,
        success: false,
      });
    }

    return response;
  }
  async findHomeDeliveryFeeUsingPickupIdStatWeighteAndNearestBusStop(
    pickupCenterId: string,
    state: NigeriaState,
    nearestBusStop: string,
    weight: number,
  ) {
    const fee =
      await this.homeDeliveryRepository.findHomeDeliveryFeeUsingPickupIdStateAndNearestBusStop(
        pickupCenterId,
        state,
        nearestBusStop,
      );

    if (!fee) {
      throw new NotFoundException({
        message: `Home delivery fee not found for ${nearestBusStop} in ${state} state.`,
        success: false,
        status: 409,
      });
    }

    const match = fee.weightRanges.find(
      (w) => weight >= w.min && weight <= w.max,
    );

    if (!match) {
      throw new NotFoundException({
        message: 'No fee for this weight range.',
        success: false,
        status: 404,
      });
    }

    return match.price;
  }

  async getAllHomeDeliveryFees(queryWithPaginationDto: QueryWithPaginationDto) {
    const response = await this.homeDeliveryRepository.getAllHomeDeliveryFees(
      queryWithPaginationDto,
    );

    return response;
  }
}
