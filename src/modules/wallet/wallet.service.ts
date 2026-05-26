import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { UsersRepository } from '../users/repositories/users.repository';
import { WalletRepository } from './repositories/wallet.repository';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async creditWallet(
    userId: string,
    amount: number,
    referenceId: string,
    source: string,
  ) {
    const uid = new Types.ObjectId(userId);
    const userExist = await this.usersRepository.findById(uid);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const response = await this.walletRepository.creditWallet(
      userExist._id.toString(),
      amount,
      referenceId,
      source,
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
    userId: string,
    amount: number,
    referenceId: string,
    source: string,
  ) {
    const uid = new Types.ObjectId(userId);
    const userExist = await this.usersRepository.findById(uid);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const response = await this.walletRepository.debitWallet(
      userExist._id.toString(),
      amount,
      referenceId,
      source,
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

  async getWallet(user: JwtUser) {
    const userId = user.sub.toString();

    const userExist = await this.usersRepository.findById(
      new Types.ObjectId(userId),
    );

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        status: 404,
        success: false,
      });
    }

    const response = await this.walletRepository.getWallet(userId);

    if (!response) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
}
