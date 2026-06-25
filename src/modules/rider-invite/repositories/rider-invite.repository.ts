import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RiderInvite,
  RiderInviteDocument,
  RiderInviteStatus,
} from '../schemas/rider-invite.schema';

@Injectable()
export class RiderInviteRepository {
  constructor(
    @InjectModel(RiderInvite.name)
    private readonly riderInviteModel: Model<RiderInviteDocument>,
  ) {}

  async createRiderInvite(data: {
    pickupCenterId: Types.ObjectId;
    businessId: Types.ObjectId;
    email: string;
    phone?: string;
    invitedBy: Types.ObjectId;
    token: string;
    expiresAt: Date;
  }) {
    const response = await new this.riderInviteModel(data).save();

    return response;
  }

  async findValidInvite(token: string) {
    const response = await this.riderInviteModel.findOne({
      token,
      status: RiderInviteStatus.pending,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    return response;
  }

  async updateRiderInviteStatus(
    id: Types.ObjectId,
    status: RiderInviteStatus,
    acceptedBy?: Types.ObjectId,
  ) {
    const response = await this.riderInviteModel.findByIdAndUpdate(
      id,
      { status, acceptedBy },
      { new: true },
    );

    return response;
  }
}
