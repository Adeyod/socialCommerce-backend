import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRiderInviteDto {
  @ApiProperty({
    description:
      'This is the Business ID of the pickup center inviting the rider.',
  })
  @IsString()
  businessId!: string;

  @ApiProperty({
    description:
      'This is the pickup center ID of the pickup center inviting the rider.',
  })
  @IsString()
  pickupCenterId!: string;

  @ApiProperty({
    description:
      'This is the email of the person to be invited as a staff of the business.',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString({ message: 'Email must be a string' })
  email!: string;

  @ApiPropertyOptional({
    description: 'This is the phone number of the user becoming rider.',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
