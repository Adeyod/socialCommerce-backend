import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { RiderInviteEvents } from '../../common/events/order.events';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesService } from '../businesses/businesses.service';
import { RiderService } from '../rider/rider.service';
import { UsersService } from '../users/users.service';
import { CreateRiderInviteDto } from './dtos/create-invite.dto';
import { RiderInviteRepository } from './repositories/rider-invite.repository';
import { RiderInviteStatus } from './schemas/rider-invite.schema';

@Injectable()
export class RiderInviteService {
  constructor(
    private readonly riderInviteRepo: RiderInviteRepository,
    private readonly riderService: RiderService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly businessesService: BusinessesService,
  ) {}

  // Create Invite
  async createRiderInvite(dto: CreateRiderInviteDto, user: JwtUser) {
    if (!user.businessId) {
      throw new BadRequestException({
        message:
          'This person inviting this rider has not registered or belong to any business.',
        success: false,
        status: 400,
      });
    }

    if (user.businessId.toString() !== dto.businessId) {
      throw new ConflictException({
        message: 'Business ID mis-match',
        success: false,
        status: 409,
      });
    }

    const userExist = await this.usersService.findUserByEmail(dto.email);

    const existing = await this.riderService.findByIdWithThrowingError(
      userExist._id.toString(),
    );

    if (existing) {
      throw new BadRequestException({
        message: 'This user is already a rider.',
        success: false,
        status: 400,
      });
    }
    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 2 days expiry

    const payload = {
      pickupCenterId: new Types.ObjectId(dto.pickupCenterId),
      businessId: new Types.ObjectId(dto.businessId),
      email: dto.email,
      phone: dto.phone,
      invitedBy: new Types.ObjectId(user.sub),
      token,
      expiresAt,
    };
    const response = await this.riderInviteRepo.createRiderInvite(payload);

    if (!response) {
      throw new BadRequestException({
        message: 'Uanble to create rider invite.',
        success: false,
        status: 400,
      });
    }

    const business = await this.businessesService.findBusinessByBusinessId(
      dto.businessId,
    );

    const eventPayload = {
      email: dto.email,
      businessName: business.businessName,
      userId: userExist._id.toString(),
      title: 'Rider invitation',
    };

    this.eventEmitter.emit(RiderInviteEvents.rider_invite_created, {
      eventPayload,
    });

    return response;
  }

  // Accept Invite
  async acceptInvite(token: string, user: JwtUser) {
    const userId = user.sub.toString();
    const invite = await this.riderInviteRepo.findValidInvite(token);

    if (!invite) {
      throw new NotFoundException({
        message: 'Invalid or expired invite',
        success: false,
        status: 404,
      });
    }

    // create rider profile
    await this.riderService.createRiderProfile(userId, invite.pickupCenterId);

    await this.riderInviteRepo.updateRiderInviteStatus(
      invite._id,
      RiderInviteStatus.accepted,
      new Types.ObjectId(userId),
    );

    return { message: 'Invite accepted successfully' };
  }
}
