import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCollectionFeeDto {
  @ApiPropertyOptional({
    description: 'This is the base fee for the first inter state product.',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  baseFee?: number;

  @ApiPropertyOptional({
    description:
      'This is the additional fee for the other inter state product.',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  additionalFee?: number;
}
