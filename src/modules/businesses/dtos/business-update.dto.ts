import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class BusinessUpdateDto {
  @ApiProperty({
    description: 'Street that the business is located.',
    example: 'Ojo-oba',
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'State that the business is located.',
    example: NigeriaState.EKITI,
  })
  @IsString()
  @IsNotEmpty()
  state!: NigeriaState;

  @ApiProperty({
    description: 'Town that the business is located.',
    example: 'Ado-Ekiti',
  })
  @IsString()
  @IsNotEmpty()
  town!: string;

  @ApiPropertyOptional({
    description: 'Country that the business is located.',
    example: 'Nigeria',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'For business that have coe.',
    example: 'ikeja-lagos',
  })
  @IsOptional()
  @IsString()
  code?: string;

  //   state: 'Oyo',
  //   country: 'Nigeria',
  //   code: 'Gbagi',
  //   centerLat: 4.3203,
  //   centerLng: 1.3364,
  //   radiusKm: 10,
}
