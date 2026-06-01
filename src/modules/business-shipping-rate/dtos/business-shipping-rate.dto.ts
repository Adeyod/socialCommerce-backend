import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class WeightRangeDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  min!: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Leave empty for open-ended range (e.g. 101+)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateBusinessShippingRateDto {
  @ApiProperty()
  @IsMongoId()
  businessId!: string;

  @ApiProperty({ enum: NigeriaState, example: NigeriaState.ABIA })
  @IsEnum(NigeriaState)
  originState!: NigeriaState;

  @ApiProperty({ enum: NigeriaState, example: NigeriaState.ABUJA })
  @IsEnum(NigeriaState)
  destinationState!: NigeriaState;

  @ApiProperty({ type: [WeightRangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightRangeDto)
  weightRanges!: WeightRangeDto[];
}
