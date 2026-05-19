import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PromoterDataDto } from '../dtos/promoter-data.dto';
import {
  PromoterProfile,
  PromoterProfileDocument,
} from '../schemas/promoter.schema';

@Injectable()
export class PromoterProfileRepository {
  constructor(
    @InjectModel(PromoterProfile.name)
    private promoterModel: Model<PromoterProfileDocument>,
  ) {}

  async createPromoterProfile(
    userId: string,
    referralCode: string,
    promoterDataDto: PromoterDataDto,
    businessId: Types.ObjectId,
  ) {
    const id = new Types.ObjectId(userId);
    // Generate referral code for promoter here before creating the promoter.
    const details = await new this.promoterModel({
      businessId,
      userId: id,
      bankName: promoterDataDto.bankName,
      accountName: promoterDataDto.accountName,
      accountNumber: promoterDataDto.accountNumber,
      referralCode,
    }).save();

    return details;
  }

  async getPromoterProfileByUserId(
    userId: string,
  ): Promise<PromoterProfileDocument | null> {
    const id = new Types.ObjectId(userId);
    const promoter = await this.promoterModel.findOne({
      userId: id,
    });
    return promoter;
  }

  async refCodeExist(code: string) {
    const response = await this.promoterModel.exists({
      referralCode: code.trim().toLowerCase(),
    });

    return response;
  }
}
