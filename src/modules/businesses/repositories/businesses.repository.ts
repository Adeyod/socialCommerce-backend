import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBusinessDto } from '../dtos/create-business.dto';
import { Business, BusinessDocument } from '../schemas/business.schema';

@Injectable()
export class BusinessesRepository {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async findBusinessWithUserId(
    userId: Types.ObjectId,
  ): Promise<BusinessDocument | null> {
    const business = await this.businessModel.findOne({
      ownerId: userId,
    });

    return business;
  }

  async findBusinessByBusinessId(
    businessId: Types.ObjectId,
  ): Promise<BusinessDocument | null> {
    const business = await this.businessModel.findById(businessId);

    return business;
  }

  async createBusiness(userId: string, createBusinessDto: CreateBusinessDto) {
    const id = new Types.ObjectId(userId);

    const newBusiness = await new this.businessModel({
      ownerId: id,
      businessName: createBusinessDto.businessName,
      businessRoles: createBusinessDto.businessRoles,
    }).save();

    return newBusiness;
  }
}
