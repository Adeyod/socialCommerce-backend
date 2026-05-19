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
import { PartnerRole } from '../../partners/enums/partner-role.enum';

export class RiderDataDto {
  @ApiProperty({
    description: 'Type of vehicle used by the rider.',
    example: 'bike',
  })
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @ApiPropertyOptional({
    description: 'Optional license number of the rider.',
    example: 'ABC-12345',
  })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

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
    description: 'The partner role the user wants to become.',
    example: 'rider',
  })
  @IsEnum(PartnerRole)
  role!: PartnerRole;
}
