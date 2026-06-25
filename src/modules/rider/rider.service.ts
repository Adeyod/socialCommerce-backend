import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RiderProfileRepository } from './repositories/rider.repository';

@Injectable()
export class RiderService {
  constructor(
    private readonly riderProfileRepository: RiderProfileRepository,
  ) {}

  async createRiderProfile(userId: string, pickupCenterId: Types.ObjectId) {
    const response = await this.riderProfileRepository.createRiderProfile(
      userId,
      pickupCenterId,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create rider profile account.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getRiderProfileByUserId(userId: string) {
    const response =
      await this.riderProfileRepository.getRiderProfileByUserId(userId);

    if (!response) {
      throw new NotFoundException({
        message: 'Rider not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async findByIdWithThrowingError(userId: string) {
    const response =
      await this.riderProfileRepository.getRiderProfileByUserId(userId);

    return response;
  }
}
