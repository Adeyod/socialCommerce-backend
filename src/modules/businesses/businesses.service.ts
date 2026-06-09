import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BusinessUpdateDto } from './dtos/business-update.dto';
import { BusinessesRepository } from './repositories/businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessesRepository) {}

  async verifyBusinessByAddingBusinessAddress(
    businessId: string,
    addressData: BusinessUpdateDto,
  ) {
    const id = new Types.ObjectId(businessId);
    const business =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!business) {
      throw new NotFoundException({
        message: 'Business not found.',
        success: false,
        status: 404,
      });
    }

    const response = await this.businessesRepository.addBusinessAddress(
      businessId,
      addressData,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to add address to this business.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
