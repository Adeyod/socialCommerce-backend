import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BusinessRole } from '../schemas/business.schema';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsArray()
  @IsEnum(BusinessRole, { each: true })
  businessRoles!: BusinessRole[];
}
