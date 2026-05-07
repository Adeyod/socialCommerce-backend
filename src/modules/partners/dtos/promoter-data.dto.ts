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

export class PromoterDataDto {
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

  @ApiProperty({
    description:
      'The account number that the promoter will be using to receive payment.',
    example: '1029382938',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please provide account number' })
  accountNumber!: string;

  @ApiProperty({
    description: 'This is the name on the account.',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please provide account name' })
  accountName!: string;

  @ApiProperty({
    description: 'Name of the bank that the account was opened.',
    example: 'Access Bank',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please provide bank name' })
  bankName!: string;
}
