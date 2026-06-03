import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    description: 'This is the product ID',
    example: '304ke9384jre835h48eh3849rh3',
  })
  @IsMongoId()
  productId!: string;

  @ApiProperty({
    description: 'This is the business ID',
    example: '304ke9384jre835h48eh3849rh3',
  })
  @IsMongoId()
  businessId!: string;

  @ApiProperty({
    description: 'This is the quantity to be added to the product',
    example: 120,
  })
  @IsNumber()
  quantity!: number; // can be negative or positive

  @ApiProperty({
    description: 'This is the reason for the adjustment',
    example: 'Some of the stock are spoilt.',
  })
  @IsString()
  reason?: string;
}
