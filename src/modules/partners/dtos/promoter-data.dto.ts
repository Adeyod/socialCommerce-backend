import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BusinessRole } from '../../businesses/schemas/business.schema';

export class PromoterDataDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsNotEmpty()
  @IsEnum(BusinessRole)
  businessRoles!: BusinessRole[];
}
