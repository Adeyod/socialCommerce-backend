import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Sneakers',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'This is more information about the product.',
    example: 'This is a nike product.',
  })
  @IsOptional()
  @IsString({ message: 'Description is a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Price of the product.',
    example: 35000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price is a number' })
  @Min(1, { message: 'Price can not be negative' })
  price?: number;

  @ApiPropertyOptional({
    description: 'This is number of the product in stock.',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Stock is a number.' })
  @Min(1, { message: 'Stock must be at least 1' }) // ✅ only applies if provided
  stock?: number;

  @ApiPropertyOptional({
    description: 'This is the category the product belong to.',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString({ message: 'Category is a string' })
  category?: string;

  @ApiPropertyOptional({
    description: 'This is tags of the product.',
    example: ['shoe'],
  })
  // @IsOptional()
  // @IsArray()
  // @Transform(({ value }) => {
  //   if (Array.isArray(value)) return value;
  //   if (typeof value === 'string') return [value];
  //   return [];
  // })
  // tags?: string[];
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // CASE 1: already array (ideal case)
    if (Array.isArray(value)) {
      return value.map((v) => v.trim()).filter(Boolean);
    }

    // CASE 2: repeated form fields sometimes come as string
    if (typeof value === 'string') {
      return [value.trim()];
    }

    return undefined;
  })
  tags?: string[];
}
