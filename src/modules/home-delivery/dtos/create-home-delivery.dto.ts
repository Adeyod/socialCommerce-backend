import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { WeightRangeDto } from '../../business-shipping-rate/dtos/business-shipping-rate.dto';
import { NigeriaState } from '../../collection/schemas/collection-fee.schema';

export class CreateHomeDeliveryFeeDto {
  @ApiProperty({ example: NigeriaState })
  @IsString()
  state!: NigeriaState;

  @ApiProperty({ example: 'oye' })
  @IsString()
  town!: string;

  @ApiProperty({ example: 'afao road' })
  @IsString()
  nearestBusStop!: string;

  @ApiProperty({ example: 'Ado-Ekiti Pickup Center' })
  @IsString()
  pickupCenterId!: string;

  @ApiProperty({ type: [WeightRangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightRangeDto)
  weightRanges!: WeightRangeDto[];
}
