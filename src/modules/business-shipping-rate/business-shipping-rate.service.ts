import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { CreateBusinessShippingRateDto } from './dtos/business-shipping-rate.dto';
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
      await this.businessShippingRateRepository.findBusinessShippingRate(
        dto.businessId,
      );

    if (businessShippingRateExist) {
      throw new ConflictException({
        message: 'This business already has shipping rate document.',
        success: false,
        status: 409,
      });
    }

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

  async getBusinessShippingPrice(businessId: string) {
    const rates =
      await this.businessShippingRateRepository.findBusinessShippingRate(
        businessId,
      );

    if (!rates) {
      throw new NotFoundException({
        message: 'Business shipping rate document not found.',
        success: false,
        status: 404,
      });
    }

    return rates;
  }
  async getBusinessShippingPricePerState(
    businessId: string,
    destinationState: string,
    weight: number,
  ) {
    const rates =
      await this.businessShippingRateRepository.findBusinessShippingRate(
        businessId,
      );

    if (!rates) {
      throw new NotFoundException({
        message: 'Business shipping rate document not found.',
        success: false,
        status: 404,
      });
    }

    const destination = rates.priceBreakdown.find(
      (d) => d.destinationState === destinationState.trim().toLowerCase(),
    );

    if (!destination) {
      throw new NotFoundException({
        message: 'Business shipping rate is not found for this state.',
        success: false,
        status: 404,
      });
    }

    const match = destination.weightRanges.find(
      (w) => weight >= w.min && weight <= w.max,
    );

    if (!match?.price) {
      throw new ConflictException({
        message: 'Business does not have price for this weigth range.',
        success: false,
        status: 409,
      });
    }

    return match.price;
  }
}
