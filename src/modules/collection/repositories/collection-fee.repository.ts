import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCollectionFeeDto } from '../dtos/create-collection-fee.dto';
import { UpdateCollectionFeeDto } from '../dtos/update-collection-fee.dto';
import {
  CollectionFee,
  CollectionFeeDocument,
  NigeriaState,
} from '../schemas/collection-fee.schema';

@Injectable()
export class CollectionFeeRepository {
  constructor(
    @InjectModel(CollectionFee.name)
    private readonly collectionFeeModel: Model<CollectionFeeDocument>,
  ) {}

  async createCollectionFee(
    createCollectionFeeDto: CreateCollectionFeeDto,
  ): Promise<CollectionFeeDocument | null> {
    const fee = await new this.collectionFeeModel({
      state: createCollectionFeeDto.state,
      baseFee: createCollectionFeeDto.baseFee,
      additionalFee: createCollectionFeeDto.additionalFee,
    }).save();

    return fee;
  }
  async updateCollectionFee(
    collectionFeeId: string,
    updateCollectionFeeDto: UpdateCollectionFeeDto,
  ): Promise<CollectionFeeDocument | null> {
    const id = new Types.ObjectId(collectionFeeId);
    const fee = await this.collectionFeeModel.findByIdAndUpdate(
      id,
      updateCollectionFeeDto,
      { returnDocument: 'after' },
    );

    return fee;
  }
  async findCollectionFeeByCollectionFeeId(
    collectionFeeId: string,
  ): Promise<CollectionFeeDocument | null> {
    const id = new Types.ObjectId(collectionFeeId);

    const fee = await this.collectionFeeModel.findOne({
      _id: id,
      isActive: true,
    });

    return fee;
  }
  async findCollectionFeeByState(
    state: NigeriaState,
  ): Promise<CollectionFeeDocument | null> {
    const fee = await this.collectionFeeModel.findOne({
      state: state,
      isActive: true,
    });

    return fee;
  }
  async deleteCollectionFee(
    collectionFeeId: string,
  ): Promise<CollectionFeeDocument | null> {
    const id = new Types.ObjectId(collectionFeeId);
    const fee = await this.collectionFeeModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );

    return fee;
  }
}
