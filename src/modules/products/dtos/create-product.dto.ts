import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class DeliveryRuleDto {
  @ApiProperty({
    example: 'Lagos',
    description: 'State name for delivery pricing',
  })
  @IsString()
  state!: string;

  @ApiProperty({
    example: 2000,
    description: 'Delivery price for this state',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Sneakers',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Delivery pricing rules per state',
    type: [DeliveryRuleDto],
    example: [
      { state: 'Lagos', price: 2000 },
      { state: 'Abuja', price: 2500 },
    ],
  })
  @Transform(({ value }) => {
    if (!value) return [];

    // Case 1: already parsed (rare)
    if (Array.isArray(value) && typeof value[0] === 'object') {
      return value;
    }

    // Case 2: array of JSON strings
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value.map((v) => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
    }

    // Case 3: single JSON string
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }

    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryRuleDto)
  deliveryRules!: DeliveryRuleDto[];

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
