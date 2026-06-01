import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { WeightRangeDto } from '../../business-shipping-rate/dtos/business-shipping-rate.dto';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class CreateHomeDeliveryFeeDto {
  @ApiProperty({ example: NigeriaState.ABIA })
  @IsString()
  buyerState!: NigeriaState; //must be the same state with the pickup center

  @ApiProperty({ example: 'oye' })
  @IsString()
  buyerTown!: string;

  @ApiProperty({ example: 'afao road' })
  @IsString()
  nearestBusStop!: string; // close bus stop to buyer house

  @ApiProperty({ example: '6a184f9d8e75aa293u483yu2y' })
  @IsString()
  pickupCenterId!: string;

  @ApiProperty({ type: [WeightRangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightRangeDto)
  weightRanges!: WeightRangeDto[];
}
