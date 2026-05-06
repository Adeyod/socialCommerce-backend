import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateBusinessDto } from '../../businesses/dtos/create-business.dto';
import { PromoterDataDto } from './promoter-data.dto';
import { RiderDataDto } from './rider-data.dto';
import { VendorDataDto } from './vendor-data.dto';

export enum PartnerRole {
  vendor = 'vendor',
  rider = 'rider',
  promoter = 'promoter',
}

export class BecomePartnerDto {
  @IsEnum(PartnerRole)
  role!: PartnerRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBusinessDto)
  business?: CreateBusinessDto;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  data!: VendorDataDto | RiderDataDto | PromoterDataDto;
}
