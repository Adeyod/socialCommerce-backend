import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { PromoterDataDto } from './dtos/promoter-data.dto';
import { RiderDataDto } from './dtos/rider-data.dto';
import { VendorDataDto } from './dtos/vendor-data.dto';
import { PartnersService } from './partners.service';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('become-rider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business partnership submitted successfully.')
  @ApiOperation({
    summary: 'Endpoint to become a rider',
    description: 'This is the endpoint that user will use to become a rider.',
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
  async becomeRider(
    @Body() riderDataDto: RiderDataDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    console.log('riderDataDto:', riderDataDto);
    const response = await this.partnersService.becomeRider(riderDataDto, user);

    return response;
  }

  @Post('become-vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business partnership submitted successfully.')
  @ApiOperation({
    summary: 'Endpoint to become a vendor',
    description: 'This is the endpoint that user will use to become a vendor.',
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
  async becomeVendor(
    @Body() vendorDataDto: VendorDataDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    console.log('vendorDataDto:', vendorDataDto);
    const response = await this.partnersService.becomeVendor(
      vendorDataDto,
      user,
    );

    return response;
  }
  @Post('become-promoter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Business partnership submitted successfully.')
  @ApiOperation({
    summary: 'Endpoint to become a promoter',
    description:
      'This is the endpoint that user will use to become a promoter.',
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
  async becomePromoter(
    @Body() promoterDataDto: PromoterDataDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    console.log('promoterDataDto:', promoterDataDto);
    const response = await this.partnersService.becomePromoter(
      promoterDataDto,
      user,
    );

    return response;
  }

  @Get('status')
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
    return res;
  }
}
