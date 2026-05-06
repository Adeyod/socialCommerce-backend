import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VendorDataDto {
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
