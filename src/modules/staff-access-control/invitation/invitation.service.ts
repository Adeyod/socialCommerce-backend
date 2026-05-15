import { ForbiddenException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../../common/types/jwt-user.type';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { UsersRepository } from '../../users/repositories/users.repository';
import { StaffInvitationDto } from './dtos/staff-invitation.dto';
import { InvitationRepository } from './repositories/invitation.repository';

@Injectable()
export class InvitationService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly invitationRepository: InvitationRepository,
  ) {}

  async inviteStaff(
    businessId: string,
    staffInvitationDto: StaffInvitationDto,
    user: JwtUser,
  ) {
    const { email, roleId } = staffInvitationDto;
    const business = new Types.ObjectId(businessId);

    const emailExist = await this.usersRepository.findByEmail(email);

    const businessExist =
      await this.businessesRepository.findBusinessByBusinessId(business);

    if (businessExist?.ownerId.toString() !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You can invite user to the business that you own.',
        success: false,
        status: 403,
      });
    }
  }
}
