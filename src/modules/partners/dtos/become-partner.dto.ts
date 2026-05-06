import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'The partner role the user wants to become.',
    enum: PartnerRole,
    example: PartnerRole.rider,
  })
  @IsEnum(PartnerRole)
  role!: PartnerRole;

  @ApiPropertyOptional({
    description:
      'Business creation data. Required only if the user does not already have a business.',
    type: CreateBusinessDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBusinessDto)
  business?: CreateBusinessDto;

  @ApiProperty({
    description: 'Role-specific data. Structure depends on the selected role.',
    discriminator: {
      propertyName: 'role',
    },
    oneOf: [
      { $ref: getSchemaPath(VendorDataDto) },
      { $ref: getSchemaPath(RiderDataDto) },
      { $ref: getSchemaPath(PromoterDataDto) },
    ],
  })
  @IsObject()
  @ValidateNested()
  data!: VendorDataDto | RiderDataDto | PromoterDataDto;
}
