import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { BecomePartnerDto } from './dtos/become-partner.dto';
import { PartnersService } from './partners.service';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('become')
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
  async checkIfPartnerHasBusiness(@GetCurrentUser() user: JwtUser) {
    return await this.partnersService.checkIfPartnerHasBusiness(user);
  }
}
