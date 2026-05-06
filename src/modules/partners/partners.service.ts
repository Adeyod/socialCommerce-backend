import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { BecomePartnerDto, PartnerRole } from './dtos/become-partner.dto';
import { PromoterDataDto } from './dtos/promoter-data.dto';
import { RiderDataDto } from './dtos/rider-data.dto';
import { VendorDataDto } from './dtos/vendor-data.dto';
import { PartnersRepository } from './repositories/partners.repository';

@Injectable()
export class PartnersService {
  constructor(
    private readonly partnersRepository: PartnersRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async checkIfPartnerHasBusiness(user: JwtUser) {
    const userExist = await this.usersRepository.findById(user.sub);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const businessExist =
      await this.businessesRepository.findBusinessWithUserId(userExist._id);

    console.log('userExist.isBusinessPartner:', userExist.isBusinessPartner);
    console.log('businessExist:', businessExist);
    console.log('!!businessExist:', !!businessExist);
    console.log('!businessExist:', !businessExist);

    return {
      isBusinessPartner: userExist.isBusinessPartner,
      hasBusiness: !!businessExist,
      business: businessExist || null,
      needsBusinessCreation: !businessExist,
    };
  }

  async becomePartner(becomePartnerDto: BecomePartnerDto, user: JwtUser) {
    const allowedRoles = [
      PartnerRole.promoter,
      PartnerRole.rider,
      PartnerRole.vendor,
    ];

    if (!allowedRoles.includes(becomePartnerDto.role)) {
      throw new BadRequestException({
        message: 'Invalid Role.',
        status: 400,
        success: false,
      });
    }
    // find business owned by this user.sub
    const findBusiness = await this.businessesRepository.findBusinessWithUserId(
      user.sub,
    );

    let userPartnerRole: object | null = null;

    switch (becomePartnerDto.role) {
      case PartnerRole.promoter: {
        userPartnerRole =
          await this.partnersRepository.getPromoterProfileByUserId(
            user.sub.toString(),
          );
        break;
      }

      case PartnerRole.rider: {
        userPartnerRole = await this.partnersRepository.getRiderProfileByUserId(
          user.sub.toString(),
        );

        break;
      }

      case PartnerRole.vendor: {
        userPartnerRole =
          await this.partnersRepository.getVendorProfileByUserId(
            user.sub.toString(),
          );
        break;
      }
    }

    if (userPartnerRole) {
      throw new BadRequestException({
        message: `You already have a ${becomePartnerDto.role} partner account.`,
        success: false,
        status: 400,
      });
    }

    let businessId: Types.ObjectId;

    if (!findBusiness) {
      if (!becomePartnerDto.business) {
        throw new BadRequestException({
          message: 'Business data is required.',
          success: false,
          status: 400,
        });
      }

      const userId = user.sub;
      const createBusinessDto = becomePartnerDto.business;

      if (
        becomePartnerDto.role.toLowerCase().trim() !==
        becomePartnerDto.business.businessRoles[0].toLowerCase().trim()
      ) {
        throw new BadRequestException({
          message:
            'Selected role and the first role inside business roles must be the same.',
          success: false,
          status: 400,
        });
      }

      const createBiz = await this.businessesRepository.createBusiness(
        userId.toString(),
        createBusinessDto,
      );

      if (!createBiz) {
        throw new BadRequestException({
          message: 'Unable to create business.',
          success: false,
          status: 400,
        });
      }

      const userDoc = await this.usersRepository.update(user.sub, {
        isBusinessPartner: true,
      });

      businessId = createBiz._id;
    } else {
      businessId = findBusiness._id;
    }

    // business is found here

    if (findBusiness && becomePartnerDto.business) {
      throw new BadRequestException({
        message: 'Business already exist.',
        success: false,
        status: 400,
      });
    }

    const referralCode = '';
    const userId = user.sub.toString();
    let partnerProfile: object;

    switch (becomePartnerDto.role) {
      case PartnerRole.promoter: {
        const data = becomePartnerDto.data as PromoterDataDto;

        const promoterAcc = await this.partnersRepository.createPromoterProfile(
          userId,
          referralCode,
          businessId,
        );
        partnerProfile = promoterAcc;
        break;
      }

      case PartnerRole.rider: {
        const data = becomePartnerDto.data as RiderDataDto;

        const riderAcc = await this.partnersRepository.createRiderProfile(
          userId,
          data,
          businessId,
        );
        partnerProfile = riderAcc;
        break;
      }

      case PartnerRole.vendor: {
        const data = becomePartnerDto.data as VendorDataDto;

        const vendorAcc = await this.partnersRepository.createVendorProfile(
          userId,
          data,
          businessId,
        );

        partnerProfile = vendorAcc;
        break;
      }
    }

    return {
      message: 'Partnership processed successfully.',
      partnerProfile,
    };

    // if business is found, then create the profile for the role using the businessId
    // if no business, create one for the user and create the profile for the requested role
    // then return the result
  }
}
