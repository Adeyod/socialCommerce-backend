import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RiderDataDto {
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;
}
