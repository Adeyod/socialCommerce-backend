import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { WalletRepository } from './repositories/wallet.repository';
import { LedgerCategory } from './schemas/ledger.schema';
import { WalletOwnerType } from './schemas/wallet.schema';
import { WalletOwner } from './types/wallet-owner.types';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly usersRepository: UsersRepository,
    private readonly businessesRepository: BusinessesRepository,
  ) {}

  async creditWalletPendingBalance(
    amount: number,
    referenceId: string,
    category: LedgerCategory,
    userId?: string,
    businessId?: string,
  ) {
    let owner: WalletOwner;

    if (userId) {
      const uid = new Types.ObjectId(userId);
      const userExist =
        await this.usersRepository.findUserByIdWithoutSession(uid);

      if (!userExist) {
        throw new NotFoundException({
          message: 'User not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.user,
        userId: userExist._id.toString(),
      };
    } else if (businessId) {
      const uid = new Types.ObjectId(businessId);
      const businessExist =
        await this.businessesRepository.findBusinessByBusinessId(uid);

      if (!businessExist) {
        throw new NotFoundException({
          message: 'Business not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.business,
        businessId: businessExist._id.toString(),
      };
    } else {
      throw new BadRequestException({
        message: 'Owner is required.',
        success: false,
        status: 400,
      });
    }

    const response = await this.walletRepository.creditWalletPendingBalance(
      owner,
      amount,
      referenceId,
      category,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to credit wallet.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
  async creditWalletWithdrawableBalance(
    amount: number,
    referenceId: string,
    category: LedgerCategory,
    userId?: string,
    businessId?: string,
  ) {
    let owner: WalletOwner;

    if (userId) {
      const uid = new Types.ObjectId(userId);
      const userExist =
        await this.usersRepository.findUserByIdWithoutSession(uid);

      if (!userExist) {
        throw new NotFoundException({
          message: 'User not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.user,
        userId: userExist._id.toString(),
      };
    } else if (businessId) {
      const uid = new Types.ObjectId(businessId);
      const businessExist =
        await this.businessesRepository.findBusinessByBusinessId(uid);

      if (!businessExist) {
        throw new NotFoundException({
          message: 'Business not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.business,
        businessId: businessExist._id.toString(),
      };
    } else {
      throw new BadRequestException({
        message: 'Owner is required.',
        success: false,
        status: 400,
      });
    }

    const response =
      await this.walletRepository.creditWalletWithdrawableBalance(
        owner,
        amount,
        referenceId,
        category,
      );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to credit wallet.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async debitWallet(
    amount: number,
    referenceId: string,
    category: LedgerCategory,
    userId?: string,
    businessId?: string,
  ) {
    let owner: WalletOwner;

    if (userId) {
      const uid = new Types.ObjectId(userId);
      const userExist =
        await this.usersRepository.findUserByIdWithoutSession(uid);

      if (!userExist) {
        throw new NotFoundException({
          message: 'User not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.user,
        userId: userExist._id.toString(),
      };
    } else if (businessId) {
      const uid = new Types.ObjectId(businessId);
      const businessExist =
        await this.businessesRepository.findBusinessByBusinessId(uid);

      if (!businessExist) {
        throw new NotFoundException({
          message: 'Business not found',
          success: false,
          status: 404,
        });
      }

      owner = {
        ownerType: WalletOwnerType.business,
        businessId: businessExist._id.toString(),
      };
    } else {
      throw new BadRequestException({
        message: 'Owner is required.',
        success: false,
        status: 400,
      });
    }

    const response = await this.walletRepository.debitWallet(
      owner,
      amount,
      referenceId,
      category,
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to debit wallet.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  // async getWallet(
  //   user: JwtUser,
  //   ownerType: WalletOwnerType,
  //   businessId?: string,
  // ) {
  //   const userId = user.sub.toString();

  //   let owner: WalletOwner;

  //   if (businessId) {
  //     const uid = new Types.ObjectId(businessId);
  //     const businessExist =
  //       await this.businessesRepository.findBusinessByBusinessId(uid);

  //     if (!businessExist) {
  //       throw new NotFoundException({
  //         message: 'Business not found',
  //         success: false,
  //         status: 404,
  //       });
  //     }

  //     owner = {
  //       ownerType: WalletOwnerType.business,
  //       businessId: businessExist._id.toString(),
  //     };
  //   } else if (userId) {
  //     const uid = new Types.ObjectId(userId);
  //     const userExist = await this.usersRepository.findUserByIdWithoutSession(uid);

  //     if (!userExist) {
  //       throw new NotFoundException({
  //         message: 'User not found',
  //         success: false,
  //         status: 404,
  //       });
  //     }

  //     owner = {
  //       ownerType: WalletOwnerType.user,
  //       userId: userExist._id.toString(),
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: 'Owner is required.',
  //       success: false,
  //       status: 400,
  //     });
  //   }

  //   const response = await this.walletRepository.getWallet(owner);

  //   if (!response) {
  //     throw new NotFoundException({
  //       message: 'Wallet not found.',
  //       success: false,
  //       status: 404,
  //     });
  //   }

  //   return response;
  // }

  async getWallet(
    user: JwtUser,
    ownerType: WalletOwnerType,
    businessId?: string,
  ) {
    let owner: WalletOwner;

    if (ownerType === WalletOwnerType.business) {
      if (!businessId) {
        throw new BadRequestException('businessId is required');
      }

      const business = await this.businessesRepository.findBusinessByBusinessId(
        new Types.ObjectId(businessId),
      );

      if (!business) throw new NotFoundException('Business not found');

      owner = {
        ownerType: WalletOwnerType.business,
        businessId: business._id.toString(),
      };
    } else {
      const userId = user.sub.toString();

      const userExist = await this.usersRepository.findUserByIdWithoutSession(
        new Types.ObjectId(userId),
      );

      if (!userExist) throw new NotFoundException('User not found');

      owner = {
        ownerType: WalletOwnerType.user,
        userId: userExist._id.toString(),
      };
    }

    return this.walletRepository.getWallet(owner);
  }
}
