import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class WeightRangeDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  min!: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  max!: number;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  price!: number;
}

class DestinationPriceDto {
  @ApiProperty({ example: NigeriaState.ABUJA })
  @IsString()
  destinationState!: string;

  @ApiProperty({ type: [WeightRangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightRangeDto)
  weightRanges!: WeightRangeDto[];
}

export class CreateBusinessShippingRateDto {
  @ApiProperty()
  @IsMongoId()
  businessId!: string;

  @ApiProperty({ example: NigeriaState.ABIA })
  @IsString()
  originState!: NigeriaState;

  @ApiProperty({ type: [DestinationPriceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinationPriceDto)
  priceBreakdown!: DestinationPriceDto[];
}
