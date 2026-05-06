import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BusinessRole } from '../../businesses/schemas/business.schema';

export class PromoterDataDto {
  @ApiProperty({
    description: 'Name of the business the promoter is associated with.',
    example: 'Klassic Marketing Agency',
  })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({
    description: 'Roles assigned to the promoter within the business.',
    enum: BusinessRole,
    isArray: true,
    example: [BusinessRole.promoter],
  })
  @IsArray()
  @IsEnum(BusinessRole, { each: true })
  businessRoles!: BusinessRole[];
}
