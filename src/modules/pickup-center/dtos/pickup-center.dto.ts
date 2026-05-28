import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class PickupCenterCreationDto {
  @ApiProperty({
    description: 'This is the name of the pickup center.',
    example: 'Ekiti State hub 1',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'This is the state that the pickup center is located.',
    example: NigeriaState.AKWA_IBOM,
  })
  @IsString()
  state!: NigeriaState;

  @ApiProperty({
    description:
      'This is the name of the town that the pickup center is located.',
    example: 'Ado-Ekiti',
  })
  @IsString()
  town!: string;

  @ApiProperty({
    description: 'This is the address of the pickup center.',
    example: 'No 22 Adebayo Estate',
  })
  @IsString()
  address!: string;

  @ApiProperty({
    description: 'This is the phone number of the pickup center.',
    example: '09039283849',
  })
  @IsString()
  phone!: string;
}
