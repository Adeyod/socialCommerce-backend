import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { WeightRangeDto } from '../business-shipping-rate/dtos/business-shipping-rate.dto';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { PickupCenterRepository } from '../pickup-center/repositories/pickup-center.repository';
import { CreateHomeDeliveryFeeDto } from './dtos/create-home-delivery.dto';
import { HomeDeliveryRepository } from './repositories/home-delivery.repository';

@Injectable()
export class HomeDeliveryService {
  constructor(
    private readonly homeDeliveryRepository: HomeDeliveryRepository,
    private readonly pickupCenterRepository: PickupCenterRepository,
  ) {}

  async createHomeDeliveryFee(dto: CreateHomeDeliveryFeeDto) {
    const pickup = await this.pickupCenterRepository.getPickupCenterById(
      dto.pickupCenterId,
    );

    if (!pickup) {
      throw new NotFoundException({
        message: `Pickup center with ID ${dto.pickupCenterId} not found.`,
        success: false,
        status: 404,
      });
    }

    if (pickup.state !== dto.buyerState) {
      throw new ConflictException({
        message: 'Buyer delivery state is different from pickup state.',
        success: false,
        status: 409,
      });
    }

    const homeDeliveryExist =
      await this.homeDeliveryRepository.findHomeDeliveryFeeUsingPickupIdStateAndNearestBusStop(
        dto.pickupCenterId,
        dto.buyerState,
        dto.nearestBusStop,
      );

    if (homeDeliveryExist) {
      throw new ConflictException({
        message: `Home delivery fee has been created for ${dto.nearestBusStop} at ${dto.buyerTown} in ${dto.buyerState} state.`,
        success: false,
        status: 409,
      });
    }

    this.validateWeightRanges(dto.weightRanges);

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
  async findHomeDeliveryFeeUsingPickupIdStateWeightAndNearestBusStop(
    pickupCenterId: string,
    buyerState: NigeriaState,
    nearestBusStop: string,
    weight: number,
  ) {
    const pickup =
      await this.pickupCenterRepository.getPickupCenterById(pickupCenterId);

    if (!pickup) {
      throw new NotFoundException({
        message: `Pickup center with ID ${pickupCenterId} not found.`,
        success: false,
        status: 404,
      });
    }

    if (pickup.state !== buyerState) {
      throw new ConflictException({
        message: 'Buyer delivery state is different from pickup state.',
        success: false,
        status: 409,
      });
    }

    const fee =
      await this.homeDeliveryRepository.findHomeDeliveryFeeUsingPickupIdStateAndNearestBusStop(
        pickupCenterId,
        buyerState,
        nearestBusStop,
      );

    if (!fee) {
      throw new NotFoundException({
        message: `Home delivery fee not found for ${nearestBusStop} in ${buyerState} state.`,
        success: false,
        status: 409,
      });
    }

    const match = fee.weightRanges.find((w) =>
      this.isInRange(weight, w.min, w.max),
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

  async getHomeDeliveryFeesToBuyerNearestBusStop(
    pickupCenterId: string,
    buyerTown: string,
    nearestBusStop: string,
  ) {
    const rates =
      await this.homeDeliveryRepository.getHomeDeliveryFeesToBuyerNearestBusStop(
        pickupCenterId,
        buyerTown,
        nearestBusStop,
      );

    if (!rates) {
      throw new NotFoundException({
        message: `Home delivery rate not found for ${nearestBusStop}.`,
        status: 404,
        success: false,
      });
    }

    return rates;
  }

  private validateWeightRanges(ranges: WeightRangeDto[]) {
    const REQUIRED_LENGTH = 6;

    if (!ranges.length) {
      throw new BadRequestException('Weight ranges are required.');
    }

    if (ranges.length !== REQUIRED_LENGTH) {
      throw new BadRequestException({
        message: `Exactly ${REQUIRED_LENGTH} weight ranges are required.`,
        success: false,
        status: 400,
      });
    }

    const sorted = [...ranges].sort((a, b) => a.min - b.min);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // price must be valid
      if (current.price < 0) {
        throw new BadRequestException('Price cannot be negative.');
      }

      // only last can be open-ended
      if (
        (current.max === undefined || current.max === null) &&
        i !== sorted.length - 1
      ) {
        throw new BadRequestException(
          'Only the last weight range can be open-ended.',
        );
      }

      // max must be greater than min
      if (current.max !== undefined && current.max !== null) {
        if (current.max < current.min) {
          throw new BadRequestException(
            'Max must be greater than or equal to min.',
          );
        }
      }

      // prevent overlap
      if (next && current.max !== undefined && current.max !== null) {
        if (current.max >= next.min) {
          throw new BadRequestException('Weight ranges must not overlap.');
        }
      }
    }
  }

  private isInRange(weight: number, min: number, max: number | null) {
    return weight >= min && (max === null || weight <= max);
  }
}
