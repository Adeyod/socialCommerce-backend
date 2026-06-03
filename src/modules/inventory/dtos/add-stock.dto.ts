import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class AddStockDto {
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
  @Min(1)
  quantity!: number;
}
