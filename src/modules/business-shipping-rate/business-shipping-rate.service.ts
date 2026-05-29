import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtUser } from '../../common/types/jwt-user.type';
import { CreateBusinessShippingRateDto } from './dtos/business-shipping-rate.dto';
import { WeightDto } from './dtos/get-business-shipping-per-state.dto';
import { BusinessShippingRateRepository } from './repositories/business-shipping-rate.repository';

@Injectable()
export class BusinessShippingRateService {
  constructor(
    private readonly businessShippingRateRepository: BusinessShippingRateRepository,
  ) {}

  async createBusinessShippingRate(
    user: JwtUser,
    dto: CreateBusinessShippingRateDto,
  ) {
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

  async getBusinessShippingPricePerState(
    businessId: string,
    destinationState: string,
    weight: WeightDto,
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
      (w) => w.min === weight.min && w.max === weight.max,
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
