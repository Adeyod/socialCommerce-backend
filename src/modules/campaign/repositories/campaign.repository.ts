import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';

@Injectable()
export class CampaignRepository {
  constructor(
    @InjectModel(Campaign.name)
    private campaignModel: Model<Campaign>,
  ) {}

  async create(data: Partial<CampaignDocument>) {
    const response = await this.campaignModel.create(data);

    return response;
  }

  async findCampaignsByBusinessId(businessId: string) {
    const id = new Types.ObjectId(businessId);

    const response = await this.campaignModel.find({ businessId: id });
    return response;
  }

  async findActiveCampaignsByBusinessId(businessId: string) {
    const id = new Types.ObjectId(businessId);

    const response = await this.campaignModel.find({
      businessId: id,
      isActive: true,
    });
    return response;
  }

  async findCampaignById(campaignId: string) {
    const id = new Types.ObjectId(campaignId);

    const response = await this.campaignModel.findById(id);
    return response;
  }
}
