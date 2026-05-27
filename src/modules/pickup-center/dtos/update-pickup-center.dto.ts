import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePickupCenterDto {
  @ApiPropertyOptional({
    description: 'This is the name of the pickup center.',
    example: 'Ekiti State hub 1',
  })
  @IsOptional()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'This is the state that the pickup center is located.',
    example: 'Ekiti State',
  })
  @IsOptional()
  @IsString()
  state!: string;

  @ApiPropertyOptional({
    description:
      'This is the name of the town that the pickup center is located.',
    example: 'Ado-Ekiti',
  })
  @IsOptional()
  @IsString()
  town!: string;

  @ApiPropertyOptional({
    description: 'This is the address of the pickup center.',
    example: 'No 22 Adebayo Estate',
  })
  @IsOptional()
  @IsString()
  address!: string;

  @ApiPropertyOptional({
    description: 'This is the phone number of the pickup center.',
    example: '09039283849',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
