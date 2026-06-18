import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCollectionFeeDto } from './dtos/create-collection-fee.dto';
import { UpdateCollectionFeeDto } from './dtos/update-collection-fee.dto';
import { CollectionFeeRepository } from './repositories/collection-fee.repository';
import { NigeriaState } from './schemas/collection-fee.schema';

@Injectable()
export class CollectionService {
  constructor(private readonly collectionRepository: CollectionFeeRepository) {}

  async createCollectionFee(createCollectionFeeDto: CreateCollectionFeeDto) {
    const stateFeeExist =
      await this.collectionRepository.findCollectionFeeByState(
        createCollectionFeeDto.state,
      );

    if (stateFeeExist) {
      throw new ConflictException({
        message: `${createCollectionFeeDto.state} has collection fee already.`,
        status: 409,
        success: false,
      });
    }

    const fee = await this.collectionRepository.createCollectionFee(
      createCollectionFeeDto,
    );

    if (!fee) {
      throw new BadRequestException({
        message: 'Unable to create collection fee.',
        status: 400,
        success: false,
      });
    }

    return fee;
  }

  async updateCollectionFee(
    collectionFeeId: string,
    updateCollectionFeeDto: UpdateCollectionFeeDto,
  ) {
    const feeExist =
      await this.collectionRepository.findCollectionFeeByCollectionFeeId(
        collectionFeeId,
      );

    if (!feeExist) {
      throw new NotFoundException({
        message: 'Collection fee not found.',
        success: false,
        status: 404,
      });
    }

    const fee = await this.collectionRepository.updateCollectionFee(
      collectionFeeId,
      updateCollectionFeeDto,
    );

    if (!fee) {
      throw new BadRequestException({
        message: 'Unable to update collection fee.',
        status: 400,
        success: false,
      });
    }

    return fee;
  }
  async deleteCollectionFee(collectionFeeId: string) {
    const feeExist =
      await this.collectionRepository.findCollectionFeeByCollectionFeeId(
        collectionFeeId,
      );

    if (!feeExist) {
      throw new NotFoundException({
        message: 'Collection fee not found.',
        success: false,
        status: 404,
      });
    }

    const fee =
      await this.collectionRepository.deleteCollectionFee(collectionFeeId);

    if (!fee) {
      throw new BadRequestException({
        message: 'Unable to delete collection fee.',
        status: 400,
        success: false,
      });
    }

    return fee;
  }

  async findCollectionFeeByCollectionFeeId(collectionFeeId: string) {
    const fee =
      await this.collectionRepository.findCollectionFeeByCollectionFeeId(
        collectionFeeId,
      );

    if (!fee) {
      throw new NotFoundException({
        message: 'Collection fee not found.',
        success: false,
        status: 404,
      });
    }

    return fee;
  }
  async findCollectionFeeByState(state: NigeriaState) {
    if (!state) {
      throw new BadRequestException({
        message: 'State is required.',
        success: false,
        status: 400,
      });
    }
    const fee = await this.collectionRepository.findCollectionFeeByState(state);

    if (!fee) {
      throw new NotFoundException({
        message: 'Collection fee not found.',
        success: false,
        status: 404,
      });
    }

    return fee;
  }
}
