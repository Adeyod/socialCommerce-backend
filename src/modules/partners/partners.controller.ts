import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { CreateBusinessDto } from '../businesses/dtos/create-business.dto';
import { Role } from '../users/schemas/user.schema';
import { BecomePartnerDto } from './dtos/become-partner.dto';
import { PromoterDataDto } from './dtos/promoter-data.dto';
import { RiderDataDto } from './dtos/rider-data.dto';
import { VendorDataDto } from './dtos/vendor-data.dto';
import { PartnersService } from './partners.service';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('become')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business partnership submitted successfully.')
  @ApiExtraModels(
    VendorDataDto,
    RiderDataDto,
    PromoterDataDto,
    CreateBusinessDto,
  )
  @ApiOperation({
    summary: 'Endpoint to become a partner',
    description: 'This is the endpoint that user will use to become a parnter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business partnership submitted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to process business partnership for this user.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async becomePartner(
    @Body() becomePartnerDto: BecomePartnerDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.partnersService.becomePartner(
      becomePartnerDto,
      user,
    );

    console.log('response:', response);
    return response;
  }

  @Get('init')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business state of user fetched successfully.')
  @ApiOperation({
    summary: 'Endpoint to get the business status of user',
    description:
      'This is the endpoint for getting the business status of the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business state of user fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to get business state for this user.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async checkIfPartnerHasBusiness(@GetCurrentUser() user: JwtUser) {
    const res = await this.partnersService.checkIfPartnerHasBusiness(user);
    console.log('res:', res);
    return res;
  }
}
