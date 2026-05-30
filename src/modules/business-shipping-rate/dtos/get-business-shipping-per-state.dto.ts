import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class WeightDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  min!: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  max!: number;
}

export class GetBusinessShippingRatePerStateDto {
  @ApiProperty()
  @IsMongoId()
  businessId!: string;

  @ApiProperty({ example: NigeriaState.ABIA })
  @IsString()
  destinationState!: NigeriaState;

  @ApiProperty({ type: Number })
  @ValidateNested({ each: true })
  weight!: number;
}
