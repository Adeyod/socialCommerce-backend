import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
