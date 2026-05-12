import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Sneakers',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'This is more information about the product.',
    example: 'This is a nike product.',
  })
  @IsOptional()
  @IsString({ message: 'Description is a string' })
  description?: string;

  @ApiProperty({
    description: 'Price of the product.',
    example: 35000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price is a number' })
  @Min(0, { message: 'Price can not be negative' })
  price!: number;

  @ApiProperty({
    description: 'This is number of the product in stock.',
    example: 'This is a nike product.',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Stock is a number.' })
  @Min(1, { message: 'Stock can not be negative' })
  stock!: number;

  @ApiPropertyOptional({
    description: 'This is the category the product belong to.',
    example: 'Electronics.',
  })
  @IsOptional()
  @IsString({ message: 'Category is a string' })
  category?: string;

  @ApiPropertyOptional({
    description: 'This is tags of the product.',
    example: ['shoe'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
  })
  tags?: string[];
}
