import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BusinessRole } from '../schemas/business.schema';

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
    enum: BusinessRole,
    isArray: true,
    example: [BusinessRole.vendor],
  })
  @IsArray()
  @IsEnum(BusinessRole, { each: true })
  businessRoles!: BusinessRole[];
}
