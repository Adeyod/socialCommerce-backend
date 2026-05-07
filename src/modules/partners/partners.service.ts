import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { generateRefCode } from '../../common/utils/helper';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { PromoterDataDto } from './dtos/promoter-data.dto';
import { RiderDataDto } from './dtos/rider-data.dto';
import { VendorDataDto } from './dtos/vendor-data.dto';
import { PartnerRole } from './enums/partner-role.enum';
import { PartnersRepository } from './repositories/partners.repository';
import {
  PromoterProfile,
  PromoterProfileDocument,
} from './schemas/promoter-profile.schema';

@Injectable()
export class PartnersService {
  constructor(
    private readonly partnersRepository: PartnersRepository,
    private readonly businessesRepository: BusinessesRepository,
    private readonly usersRepository: UsersRepository,
    @InjectModel(PromoterProfile.name)
    private promoterModel: Model<PromoterProfileDocument>,
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
      await this.partnersRepository.getRiderProfileByUserId(
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

    const riderAcc = await this.partnersRepository.createRiderProfile(
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

    const userPartnerRole =
      await this.partnersRepository.getVendorProfileByUserId(
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

    const vendorAcc = await this.partnersRepository.createVendorProfile(
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
      await this.partnersRepository.getPromoterProfileByUserId(
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
      const existing = await this.promoterModel.exists({
        referralCode: refCode.trim().toLowerCase(),
      });
      exists = !!existing;
    } while (exists);

    const referralCode = refCode;

    const promoterAcc = await this.partnersRepository.createPromoterProfile(
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

  // async becomePartner(becomePartnerDto: BecomePartnerDto, user: JwtUser) {
  //   const allowedRoles = [
  //     PartnerRole.promoter,
  //     PartnerRole.rider,
  //     PartnerRole.vendor,
  //   ];

  //   if (!allowedRoles.includes(becomePartnerDto.role)) {
  //     throw new BadRequestException({
  //       message: 'Invalid Role.',
  //       status: 400,
  //       success: false,
  //     });
  //   }
  //   // find business owned by this user.sub
  //   const findBusiness = await this.businessesRepository.findBusinessWithUserId(
  //     user.sub,
  //   );

  //   let userPartnerRole: object | null = null;

  //   switch (becomePartnerDto.role) {
  //     case PartnerRole.promoter: {
  //       userPartnerRole =
  //         await this.partnersRepository.getPromoterProfileByUserId(
  //           user.sub.toString(),
  //         );
  //       break;
  //     }

  //     case PartnerRole.rider: {
  //       userPartnerRole = await this.partnersRepository.getRiderProfileByUserId(
  //         user.sub.toString(),
  //       );

  //       break;
  //     }

  //     case PartnerRole.vendor: {
  //       userPartnerRole =
  //         await this.partnersRepository.getVendorProfileByUserId(
  //           user.sub.toString(),
  //         );
  //       break;
  //     }
  //   }

  //   if (userPartnerRole) {
  //     throw new BadRequestException({
  //       message: `You already have a ${becomePartnerDto.role} partner account.`,
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   let businessId: Types.ObjectId;

  //   if (!findBusiness) {
  //     if (!becomePartnerDto.business) {
  //       throw new BadRequestException({
  //         message: 'Business data is required.',
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const userId = user.sub;
  //     const createBusinessDto = becomePartnerDto.business;

  //     if (
  //       becomePartnerDto.role.toLowerCase().trim() !==
  //       becomePartnerDto.business.businessRoles[0].toLowerCase().trim()
  //     ) {
  //       throw new BadRequestException({
  //         message:
  //           'Selected role and the first role inside business roles must be the same.',
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const createBiz = await this.businessesRepository.createBusiness(
  //       userId.toString(),
  //       createBusinessDto,
  //     );

  //     if (!createBiz) {
  //       throw new BadRequestException({
  //         message: 'Unable to create business.',
  //         success: false,
  //         status: 400,
  //       });
  //     }

  //     const userDoc = await this.usersRepository.update(user.sub, {
  //       isBusinessPartner: true,
  //     });

  //     businessId = createBiz._id;
  //   } else {
  //     businessId = findBusiness._id;
  //   }

  //   // business is found here

  //   if (findBusiness && becomePartnerDto.business) {
  //     throw new BadRequestException({
  //       message: 'Business already exist.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   let refCode: string;
  //   let exists = true;
  //   const userId = user.sub.toString();
  //   let partnerProfile: object;

  //   switch (becomePartnerDto.role) {
  //     case PartnerRole.promoter: {
  //       const data = becomePartnerDto.data as PromoterDataDto;

  //       do {
  //         const code = generateRefCode();
  //         refCode = code;
  //         const existing = await this.promoterModel.exists({
  //           referralCode: refCode.trim().toLowerCase(),
  //         });
  //         exists = !!existing;
  //       } while (exists);

  //       const referralCode = refCode;

  //       const promoterAcc = await this.partnersRepository.createPromoterProfile(
  //         userId,
  //         referralCode,
  //         data,
  //         businessId,
  //       );
  //       partnerProfile = promoterAcc;
  //       break;
  //     }

  //     case PartnerRole.rider: {
  //       const data = becomePartnerDto.data as RiderDataDto;

  //       const riderAcc = await this.partnersRepository.createRiderProfile(
  //         userId,
  //         data,
  //         businessId,
  //       );
  //       partnerProfile = riderAcc;
  //       break;
  //     }

  //     case PartnerRole.vendor: {
  //       const data = becomePartnerDto.data as VendorDataDto;

  //       const vendorAcc = await this.partnersRepository.createVendorProfile(
  //         userId,
  //         data,
  //         businessId,
  //       );

  //       partnerProfile = vendorAcc;
  //       break;
  //     }
  //   }

  //   return {
  //     message: 'Partnership processed successfully.',
  //     partnerProfile,
  //   };

  //   // if business is found, then create the profile for the role using the businessId
  //   // if no business, create one for the user and create the profile for the requested role
  //   // then return the result
  // }

  // async updateVendorDetails(user: JwtUser, updateVendorDetailsDto: UpdateVendorDetailsDto) {
  //   const {logo, banner, address, phoneNumber, businessHours} = updateVendorDetailsDto

  //   if(logo) {
  //     // Upload logo to cloudinary and store the public_url and url
  //   }

  //   if(banner) {
  //     // Upload banner to cloudinary and store the public_url and url

  //   }

  //   const payload = {
  //     address,
  //     phoneNumber,
  //     businessHours,
  //     logoObj: {

  //     }
  //     bannerObj: {
  //       url,
  //       public_url,
  //     }
  //   }
  // }
}
