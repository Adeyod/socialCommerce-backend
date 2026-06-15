import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generateRefCode } from '../../common/utils/helper';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { PickupCenterPartnerDto } from '../pickup-center/dtos/pickup-center.dto';
import { PickupCenterRepository } from '../pickup-center/repositories/pickup-center.repository';
import { PromoterDataDto } from '../promoters/dtos/promoter-data.dto';
import { PromoterProfileRepository } from '../promoters/repositories/promoter.repository';
import { RiderDataDto } from '../rider/dtos/rider-data.dto';
import { RiderProfileRepository } from '../rider/repositories/rider.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { VendorDataDto } from '../vendor/dtos/vendor-data.dto';
import { VendorService } from '../vendor/vendor.service';
import { OwnershipType, PartnerRole } from './enums/partner-role.enum';

@Injectable()
export class PartnersService {
  constructor(
    private readonly pickupCenterRepository: PickupCenterRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly vendorService: VendorService,
    private readonly riderProfileRepository: RiderProfileRepository,
    private readonly promoterProfileRepository: PromoterProfileRepository,

    @Inject(forwardRef(() => UsersRepository))
    private readonly usersRepository: UsersRepository,
  ) {}

  async checkIfPartnerHasBusiness(user: JwtUser) {
    const userExist = await this.usersRepository.findUserByIdWithoutSession(
      user.sub,
    );

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const businessExist =
      await this.businessesRepository.findBusinessWithUserId(
        userExist._id.toString(),
      );

    return {
      isBusinessPartner: userExist.isBusinessPartner,
      hasBusiness: !!businessExist,
      business: businessExist || null,
      needsBusinessCreation: !businessExist,
    };
  }

  async becomeRider(riderDataDto: RiderDataDto, user: JwtUser) {
    if (riderDataDto.role !== PartnerRole.rider) {
      throw new BadRequestException({
        message: 'Invalid Role.',
        status: 400,
        success: false,
      });
    }
    // find business owned by this user.sub
    const findBusiness = await this.businessesRepository.findBusinessWithUserId(
      user.sub.toString(),
    );

    const userPartnerRole =
      await this.riderProfileRepository.getRiderProfileByUserId(
        user.sub.toString(),
      );

    if (userPartnerRole) {
      throw new BadRequestException({
        message: `You already have a ${riderDataDto.role} partner account.`,
        success: false,
        status: 400,
      });
    }

    let businessId: Types.ObjectId;

    if (!findBusiness) {
      if (!riderDataDto.business) {
        throw new BadRequestException({
          message: 'Business data is required.',
          success: false,
          status: 400,
        });
      }

      const userId = user.sub;
      const createBusinessDto = riderDataDto.business;

      if (
        riderDataDto.role.toLowerCase().trim() !==
        riderDataDto.business.businessRoles[0].toLowerCase().trim()
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

    if (
      findBusiness &&
      findBusiness.businessRoles.includes(riderDataDto.role)
    ) {
      throw new BadRequestException({
        message: 'Business already exist.',
        success: false,
        status: 400,
      });
    }
    const userId = user.sub.toString();

    const riderAcc = await this.riderProfileRepository.createRiderProfile(
      userId,
      riderDataDto,
      businessId,
    );

    const updateBusiness = await this.businessesRepository.addPartnerRole(
      businessId.toString(),
      riderDataDto.role,
    );

    return {
      message: 'Partnership processed successfully.',
      partnerProfile: riderAcc,
    };

    // if business is found, then create the profile for the role using the businessId
    // if no business, create one for the user and create the profile for the requested role
    // then return the result
  }
  async becomeVendor(vendorDataDto: VendorDataDto, user: JwtUser) {
    if (vendorDataDto.role !== PartnerRole.vendor) {
      throw new BadRequestException({
        message: 'Invalid Role.',
        status: 400,
        success: false,
      });
    }
    // find business owned by this user.sub
    const findBusiness = await this.businessesRepository.findBusinessWithUserId(
      user.sub.toString(),
    );

    const userPartnerRole = await this.vendorService.getVendorProfileByUserId(
      user.sub.toString(),
    );

    if (userPartnerRole) {
      throw new BadRequestException({
        message: `You already have a ${vendorDataDto.role} partner account.`,
        success: false,
        status: 400,
      });
    }

    let businessId: Types.ObjectId;

    if (!findBusiness) {
      if (!vendorDataDto.business) {
        throw new BadRequestException({
          message: 'Business data is required.',
          success: false,
          status: 400,
        });
      }

      const userId = user.sub;
      const createBusinessDto = vendorDataDto.business;

      if (
        vendorDataDto.role.toLowerCase().trim() !==
        vendorDataDto.business.businessRoles[0].toLowerCase().trim()
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

    if (
      findBusiness &&
      findBusiness.businessRoles.includes(vendorDataDto.role)
    ) {
      throw new BadRequestException({
        message: 'Business already exist.',
        success: false,
        status: 400,
      });
    }
    const userId = user.sub.toString();

    const vendorAcc = await this.vendorService.createVendorProfile(
      userId,
      vendorDataDto,
      businessId,
    );

    const updateBusiness = await this.businessesRepository.addPartnerRole(
      businessId.toString(),
      vendorDataDto.role,
    );

    return {
      message: 'Partnership processed successfully.',
      partnerProfile: vendorAcc,
    };

    // if business is found, then create the profile for the role using the businessId
    // if no business, create one for the user and create the profile for the requested role
    // then return the result
  }
  async becomePromoter(promoterDataDto: PromoterDataDto, user: JwtUser) {
    if (promoterDataDto.role !== PartnerRole.promoter) {
      throw new BadRequestException({
        message: 'Invalid Role.',
        status: 400,
        success: false,
      });
    }
    // find business owned by this user.sub
    const findBusiness = await this.businessesRepository.findBusinessWithUserId(
      user.sub.toString(),
    );

    const userPartnerRole =
      await this.promoterProfileRepository.getPromoterProfileByUserId(
        user.sub.toString(),
      );

    if (userPartnerRole) {
      throw new BadRequestException({
        message: `You already have a ${promoterDataDto.role} partner account.`,
        success: false,
        status: 400,
      });
    }

    let businessId: Types.ObjectId;

    if (!findBusiness) {
      if (!promoterDataDto.business) {
        throw new BadRequestException({
          message: 'Business data is required.',
          success: false,
          status: 400,
        });
      }

      const userId = user.sub;
      const createBusinessDto = promoterDataDto.business;

      if (
        promoterDataDto.role.toLowerCase().trim() !==
        promoterDataDto.business.businessRoles[0].toLowerCase().trim()
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

    if (
      findBusiness &&
      findBusiness.businessRoles.includes(promoterDataDto.role)
    ) {
      throw new BadRequestException({
        message: 'Business already exist.',
        success: false,
        status: 400,
      });
    }
    const userId = user.sub.toString();
    let refCode: string;
    let exists = true;

    do {
      const code = generateRefCode();
      refCode = code;
      const existing =
        await this.promoterProfileRepository.refCodeExist(refCode);
      exists = !!existing;
    } while (exists);

    const referralCode = refCode;

    const promoterAcc =
      await this.promoterProfileRepository.createPromoterProfile(
        userId,
        referralCode,
        promoterDataDto,
        businessId,
      );

    const updateBusiness = await this.businessesRepository.addPartnerRole(
      businessId.toString(),
      promoterDataDto.role,
    );

    return {
      message: 'Partnership processed successfully.',
      partnerProfile: promoterAcc,
    };

    // if business is found, then create the profile for the role using the businessId
    // if no business, create one for the user and create the profile for the requested role
    // then return the result
  }

  async becomePickupCenter(dto: PickupCenterPartnerDto, user: JwtUser) {
    if (dto.role !== PartnerRole.partner_pickup_center) {
      throw new BadRequestException({
        message: 'Invalid Role.',
        success: false,
        status: 400,
      });
    }

    const findBusiness = await this.businessesRepository.findBusinessWithUserId(
      user.sub.toString(),
    );

    const existing =
      await this.pickupCenterRepository.getPickupCenterByName(dto);

    if (existing) {
      throw new BadRequestException({
        message: 'This pickup center already exist in this state.',
        success: false,
        status: 400,
      });
    }

    let businessId: Types.ObjectId;

    if (!findBusiness) {
      if (!dto.business) {
        throw new BadRequestException({
          message: 'Business data is required',
          success: false,
          status: 400,
        });
      }
      const userId = user.sub;
      const createBusinessDto = dto.business;

      if (
        dto.role.toLowerCase().trim() !==
        dto.business.businessRoles[0].toLowerCase().trim()
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

      await this.usersRepository.update(user.sub, {
        isBusinessPartner: true,
      });

      businessId = createBiz._id;
    } else {
      businessId = findBusiness._id;
    }

    const bizId = businessId.toString();

    const payload = {
      name: dto.name,
      state: dto.state,
      town: dto.town,
      address: dto.address,
      phone: dto.phone,
      businessId: bizId,
      ownershipType: OwnershipType.partner,
    };
    // CREATE PICKUP CENTER LINKED TO BUSINESS
    const pickupCenter =
      await this.pickupCenterRepository.createPickupCenter(payload);

    await this.businessesRepository.addPartnerRole(
      businessId.toString(),
      PartnerRole.partner_pickup_center,
    );

    return {
      message: 'Pickup center application submitted. Awaiting approval.',
      pickupCenter,
    };
  }

  async getAllProfilesByUserId(userId: string) {
    const [vendor, rider, promoter] = await Promise.all([
      this.vendorService.findVendorProfileByUserId(userId),
      this.promoterProfileRepository.getPromoterProfileByUserId(userId),
      this.riderProfileRepository.getRiderProfileByUserId(userId),
    ]);

    return {
      vendor,
      rider,
      promoter,
    };
  }
}
