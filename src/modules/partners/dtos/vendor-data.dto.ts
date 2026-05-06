import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VendorDataDto {
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
