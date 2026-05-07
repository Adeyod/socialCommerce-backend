import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateBusinessDto } from '../../businesses/dtos/create-business.dto';
import { PartnerRole } from '../enums/partner-role.enum';

export class VendorDataDto {
  @ApiProperty({
    description: 'The partner role the user wants to become.',
    example: 'vendor',
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
    description: 'Name of the vendor store.',
    example: 'Klassic Kitchen',
  })
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the store.',
    example: 'We sell delicious local and continental meals.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
