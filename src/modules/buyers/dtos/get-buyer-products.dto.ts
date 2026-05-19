import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum FeedType {
  recommended = 'recommended',
  new = 'new',
  low_exposure = 'low_exposure',
}

export enum SortOption {
  price = 'price',
  newest = 'newest',
  rating = 'rating',
}
export class GetBuyerProductsDto {
  @ApiPropertyOptional({
    description: 'Search products by name, category or tags',
  })
  @IsOptional()
  @IsString()
  searchParams?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Feed type',
    enum: FeedType,
  })
  @IsOptional()
  @IsString()
  feed?: FeedType;

  @ApiPropertyOptional({
    description: 'Sort option',
    enum: SortOption,
  })
  @IsOptional()
  @IsString()
  sort?: SortOption;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
