import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PartnerRole } from '../../partners/enums/partner-role.enum';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Name of the business.',
    example: 'Klassic Food Hub',
  })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({
    description: 'Roles assigned to the business.',
    enum: PartnerRole,
    isArray: true,
    example: [PartnerRole.vendor],
  })
  @IsArray()
  @IsEnum(PartnerRole, { each: true })
  businessRoles!: PartnerRole[];
}
