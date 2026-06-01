import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import {
  CreateBusinessShippingRateDto,
  WeightRangeDto,
} from './dtos/business-shipping-rate.dto';
import { BusinessShippingRateRepository } from './repositories/business-shipping-rate.repository';

@Injectable()
export class BusinessShippingRateService {
  constructor(
    private readonly businessShippingRateRepository: BusinessShippingRateRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async createBusinessShippingRate(
    user: JwtUser,
    dto: CreateBusinessShippingRateDto,
  ) {
    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(
        new Types.ObjectId(dto.businessId),
      );

    if (!businessExist) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    if (
      !businessExist.businessAddress ||
      !businessExist.businessAddress.state
    ) {
      throw new NotFoundException({
        message: 'Business has no address recorded yet.',
        success: false,
        status: 404,
      });
    }

    if (
      businessExist.businessAddress.state.trim().toLowerCase() !==
      dto.originState.trim().toLowerCase()
    ) {
      throw new ConflictException({
        message: 'Invalid origin state for this business.',
        success: false,
        status: 409,
      });
    }
    const businessShippingRateExist =
      await this.businessShippingRateRepository.findByBusinessAndDestination(
        dto.businessId,
        dto.destinationState,
      );

    if (businessShippingRateExist) {
      throw new ConflictException({
        message: `This business already has shipping rate document for ${dto.originState}.`,
        success: false,
        status: 409,
      });
    }

    this.validateWeightRanges(dto.weightRanges);

    const response =
      await this.businessShippingRateRepository.createBusinessShippingRate(dto);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create business shipping rates.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async findBusinessShippingRateForAllStates(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const rates =
      await this.businessShippingRateRepository.findBusinessShippingRateForAllStates(
        businessId,
        queryWithPaginationDto,
      );

    if (!rates) {
      throw new NotFoundException({
        message: 'Business shipping rate documents not found.',
        success: false,
        status: 404,
      });
    }

    return rates;
  }
  async getBusinessShippingPricePerState(
    businessId: string,
    destinationState: NigeriaState,
    weight: number,
  ) {
    console.log('businessId:', businessId);
    console.log('destinationState:', destinationState);
    console.log('weight:', weight);
    const rates =
      await this.businessShippingRateRepository.findBusinessShippingRatePerDestinationState(
        businessId,
        destinationState,
      );

    console.log('rates:', rates);
    if (!rates) {
      throw new NotFoundException({
        message: 'Business shipping rate document not found.',
        success: false,
        status: 404,
      });
    }

    const match = rates.weightRanges.find((w) =>
      this.isInRange(weight, w.min, w.max),
    );

    console.log('match:', match);

    if (!match?.price) {
      throw new ConflictException({
        message: 'Business does not have price for this weigth range.',
        success: false,
        status: 409,
      });
    }

    return match.price;
  }

  async getBusinessShippingRatesToBuyerState(
    businessId: string,
    destinationState: NigeriaState,
    user: JwtUser,
  ) {
    const rates =
      await this.businessShippingRateRepository.findByBusinessAndDestination(
        businessId,
        destinationState,
      );

    if (!rates) {
      throw new NotFoundException({
        message: `Business rates for ${destinationState} state is not found.`,
        success: false,
        status: 404,
      });
    }

    return rates;
  }

  private validateWeightRanges(ranges: WeightRangeDto[]) {
    if (!ranges.length) {
      throw new BadRequestException('Weight ranges are required.');
    }

    const sorted = [...ranges].sort((a, b) => a.min - b.min);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // ❌ price must be valid
      if (current.price < 0) {
        throw new BadRequestException('Price cannot be negative.');
      }

      // ❌ only last can be open-ended
      if (
        (current.max === undefined || current.max === null) &&
        i !== sorted.length - 1
      ) {
        throw new BadRequestException(
          'Only the last weight range can be open-ended.',
        );
      }

      // ❌ max must be greater than min
      if (current.max !== undefined && current.max !== null) {
        if (current.max < current.min) {
          throw new BadRequestException(
            'Max must be greater than or equal to min.',
          );
        }
      }

      // ❌ prevent overlap
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
