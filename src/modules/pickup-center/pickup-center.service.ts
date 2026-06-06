import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { PickupCenterCreationDto } from './dtos/pickup-center.dto';
import { UpdatePickupCenterDto } from './dtos/update-pickup-center.dto';
import { PickupCenterRepository } from './repositories/pickup-center.repository';

@Injectable()
export class PickupCenterService {
  constructor(
    private readonly pickupCenterRepository: PickupCenterRepository,
  ) {}

  async createPickupCenter(dto: PickupCenterCreationDto) {
    const nameExist =
      await this.pickupCenterRepository.getPickupCenterByName(dto);

    if (nameExist) {
      throw new ConflictException({
        messgage: `Pickup center with ${dto.name} already exist in ${dto.town}, ${dto.state} state.`,
        status: 409,
        success: false,
      });
    }

    const response = await this.pickupCenterRepository.createPickupCenter(dto);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create pick up center.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getAllPickupCenters() {
    const centers = await this.pickupCenterRepository.getAllPickupCenters();

    if (!centers || centers.length === 0) {
      throw new BadRequestException({
        message: 'Unable to fetch pick up centers.',
        success: false,
        status: 400,
      });
    }

    return centers;
  }
  async getPickupCenterById(pickupCenterId: string) {
    const centers =
      await this.pickupCenterRepository.getPickupCenterById(pickupCenterId);

    if (!centers) {
      throw new BadRequestException({
        message: 'Unable to fetch pick up center.',
        success: false,
        status: 400,
      });
    }

    return centers;
  }
  async getStateMainPickupCenterByState(state: NigeriaState) {
    const centers =
      await this.pickupCenterRepository.getStateMainPickupCenterByState(state);

    if (!centers) {
      throw new BadRequestException({
        message: 'Unable to fetch state main pick up center.',
        success: false,
        status: 400,
      });
    }

    return centers;
  }
  async getPickupCenterByState(state: NigeriaState) {
    const centers =
      await this.pickupCenterRepository.getPickupCentersByState(state);

    if (!centers || centers.length === 0) {
      throw new BadRequestException({
        message: 'Unable to fetch pick up centers.',
        success: false,
        status: 400,
      });
    }

    return centers;
  }
  async updatePickupCenterById(
    pickupCenterId: string,
    updateData: UpdatePickupCenterDto,
  ) {
    const centerExist =
      await this.pickupCenterRepository.getPickupCenterById(pickupCenterId);

    if (!centerExist) {
      throw new NotFoundException({
        message: 'Pickup center not found.',
        success: false,
        status: 404,
      });
    }
    const centers = await this.pickupCenterRepository.updatePickupCenterById(
      pickupCenterId,
      updateData,
    );

    return centers;
  }
  async deactivatePickupCenterById(pickupCenterId: string) {
    const center =
      await this.pickupCenterRepository.deactivatePickupCenterById(
        pickupCenterId,
      );

    if (!center) {
      throw new BadRequestException({
        message: 'Unable to deactivate pick up center.',
        success: false,
        status: 400,
      });
    }

    return center;
  }
  async findClosestPickupCenters(state: NigeriaState) {
    const centers =
      await this.pickupCenterRepository.findClosestPickupCenters(state);

    if (!centers || centers.length === 0) {
      throw new BadRequestException({
        message: 'Unable to fetch closest pick up centers.',
        success: false,
        status: 400,
      });
    }

    return centers;
  }

  async getStatesThatHasPickupCenters() {
    const states =
      await this.pickupCenterRepository.getStatesThatHasPickupCenters();

    if (!states || states.length === 0) {
      throw new NotFoundException({
        message: 'There is no pickup center in any state yet.',
        success: false,
        status: 404,
      });
    }

    return states;
  }

  async updatePickupCenterToStateMainPickupCenter(
    pickupCenterId: string,
    state: NigeriaState,
  ) {
    const pickupCenterExist =
      await this.pickupCenterRepository.getPickupCenterById(pickupCenterId);

    if (!pickupCenterExist) {
      throw new NotFoundException({
        message: 'Pickup center not found.',
        success: false,
        status: 404,
      });
    }

    const stateMain =
      await this.pickupCenterRepository.getStateMainPickupCenterByState(state);

    if (stateMain) {
      stateMain.isMainHub = false;
      await stateMain.save();
    }

    const response =
      await this.pickupCenterRepository.updatePickupCenterToStateMainPickupCenter(
        pickupCenterId,
        state,
      );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to change state main pick up center.',
        status: 400,
        success: false,
      });
    }

    return response;
  }
}
