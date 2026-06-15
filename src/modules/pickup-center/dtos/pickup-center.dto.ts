import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateBusinessDto } from '../../businesses/dtos/create-business.dto';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';
import {
  OwnershipType,
  PartnerRole,
} from '../../partners/enums/partner-role.enum';

export class PickupCenterCreationDto {
  @ApiPropertyOptional({
    description:
      'This is the business ID of the business that owns the pickup center.',
    example: '102o3948u5hj438e3h4u5',
  })
  @IsOptional()
  businessId?: string;

  @ApiProperty({
    description: 'This is the name of the pickup center.',
    example: 'Ekiti State hub 1',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'This is the state that the pickup center is located.',
    example: NigeriaState.AKWA_IBOM,
  })
  @IsString()
  state!: NigeriaState;

  @ApiProperty({
    description:
      'This is the name of the town that the pickup center is located.',
    example: 'Ado-Ekiti',
  })
  @IsString()
  town!: string;

  @ApiProperty({
    description: 'This is the address of the pickup center.',
    example: 'No 22 Adebayo Estate',
  })
  @IsString()
  address!: string;

  @ApiProperty({
    description: 'This is the phone number of the pickup center.',
    example: '09039283849',
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'This is the ownership type of the pickup center.',
    example: OwnershipType.partner,
  })
  @IsEnum(OwnershipType)
  ownershipType!: OwnershipType;
}

export class PickupCenterPartnerDto extends PickupCenterCreationDto {
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
    example: 'promoter',
  })
  @IsEnum(PartnerRole)
  role!: PartnerRole;
}
