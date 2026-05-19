import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BusinessesRepository } from '../businesses/repositories/businesses.repository';
import { PartnersService } from '../partners/partners.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private partnersService: PartnersService,
    private businessesRepository: BusinessesRepository,
  ) {}
  async findUserById(id: Types.ObjectId): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userObj = user.toObject();
    const { password, ...others } = userObj;

    return others;
  }

  async findMeById(id: Types.ObjectId) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const myBusiness = await this.businessesRepository.findBusinessWithUserId(
      user._id.toString(),
    );

    const roles = await this.partnersService.getAllProfilesByUserId(
      user._id.toString(),
    );

    const userObj = user.toObject();
    const { password, ...others } = userObj;

    const userDetails = {
      others,
      roles,
      business: myBusiness ? myBusiness : null,
    };

    return userDetails;
  }

  async findUserByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        success: false,
        status: 404,
      });
    }

    const userObj = user.toObject();

    const { password, ...others } = userObj;

    return others;
  }

  async verifyUser(id: Types.ObjectId): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, { isVerified: true });

    if (!user) {
      throw new BadRequestException({
        message: 'Unable to verify user',
        status: 400,
        success: false,
      });
    }

    const { password, ...others } = user.toObject();

    return others;
  }

  async resetPassword(
    id: Types.ObjectId,
    hashedPassword: string,
  ): Promise<UserResponseDto> {
    const findUserAndUpdate = await this.usersRepository.update(id, {
      password: hashedPassword,
    });

    if (!findUserAndUpdate) {
      throw new BadRequestException({
        message: 'Unable to reset user password',
        success: false,
        status: 400,
      });
    }

    const { password, ...others } = findUserAndUpdate;

    return others;
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    referredBy: string | undefined;
  }): Promise<UserResponseDto> {
    const user = await this.usersRepository.create(data);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Unable to create user',
        success: false,
        status: 401,
      });
    }

    const { password, ...others } = user;
    return others;
  }
}
