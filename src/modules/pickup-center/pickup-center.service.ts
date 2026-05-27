import { Injectable } from '@nestjs/common';
import { PickupCenterCreationDto } from './dtos/pickup-center.dto';
import { UpdatePickupCenterDto } from './dtos/update-pickup-center.dto';
import { PickupCenterRepository } from './repositories/pickup-center.repository';

@Injectable()
export class PickupCenterService {
  constructor(
    private readonly pickupCenterRepository: PickupCenterRepository,
  ) {}

  async createPickupCenter(dto: PickupCenterCreationDto) {
    const response = await this.pickupCenterRepository.createPickupCenter(dto);

    return response;
  }

  async getAllPickupCenters() {
    const centers = await this.pickupCenterRepository.getAllPickupCenters();

    return centers;
  }
  async getPickupCenterById(pickupCenterId: string) {
    const centers =
      await this.pickupCenterRepository.getPickupCenterById(pickupCenterId);

    return centers;
  }
  async getStateMainPickupCenterByState(state: string) {
    const centers =
      await this.pickupCenterRepository.getStateMainPickupCenterByState(state);

    return centers;
  }
  async getPickupCenterByState(state: string) {
    const centers =
      await this.pickupCenterRepository.getPickupCenterByState(state);

    return centers;
  }
  async updatePickupCenterById(
    pickupCenterId: string,
    updateData: UpdatePickupCenterDto,
  ) {
    const centers = await this.pickupCenterRepository.updatePickupCenterById(
      pickupCenterId,
      updateData,
    );

    return centers;
  }
  async deactivatePickupCenterById(pickupCenterId: string) {
    const centers =
      await this.pickupCenterRepository.deactivatePickupCenterById(
        pickupCenterId,
      );

    return centers;
  }
  async findClosestPickupCenters(state: string) {
    const centers =
      await this.pickupCenterRepository.findClosestPickupCenters(state);

    return centers;
  }
}
