import { ApiProperty } from '@nestjs/swagger';

export class AddItemToCartDto {
  @ApiProperty({
    description: 'This is the ID of the product to be added.',
    example: '1owuenfue39485jrwhw9394',
  })
  productId!: string;

  @ApiProperty({
    description: 'This is the ID of the business that owns the product.',
    example: '1owuenfue39485jrwhw9394',
  })
  businessId!: string;

  @ApiProperty({
    description:
      'This is the quantity of the product that the buyer is adding to cart.',
    example: 5,
  })
  quantity!: number;
}
