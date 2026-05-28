import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { NigeriaState } from '../schemas/collection-fee.schema';

export class CreateCollectionFeeDto {
  @ApiProperty({
    description:
      'This is the name of the state that the collection fee is for.',
    example: NigeriaState.EKITI,
  })
  @IsString()
  state!: NigeriaState;

  @ApiProperty({
    description: 'This is the base fee for the first inter state product.',
    example: 500,
  })
  @IsNumber()
  @Min(100)
  baseFee!: number;

  @ApiProperty({
    description:
      'This is the additional fee for the other inter state product.',
    example: 500,
  })
  @IsNumber()
  @Min(100)
  additionalFee!: number;
}
