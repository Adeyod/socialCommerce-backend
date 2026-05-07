import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { CreateBusinessDto } from '../../businesses/dtos/create-business.dto';
import { PartnerRole } from '../enums/partner-role.enum';
import { PromoterDataDto } from './promoter-data.dto';
import { RiderDataDto } from './rider-data.dto';
import { VendorDataDto } from './vendor-data.dto';

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

  // Try to solve the issue here
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
  @Type(() => Object, {
    discriminator: {
      property: 'role',
      subTypes: [
        { value: VendorDataDto, name: PartnerRole.vendor },
        { value: RiderDataDto, name: PartnerRole.rider },
        { value: PromoterDataDto, name: PartnerRole.promoter },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  data!: VendorDataDto | RiderDataDto | PromoterDataDto;
}
