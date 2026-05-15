import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class StaffInvitationDto {
  @ApiProperty({
    description:
      'This is the email of the person to be invited as a staff of the business.',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString({ message: 'Email must be a string' })
  email!: string;

  @ApiProperty({
    description:
      'This is the ID of the role that the owner wanted to give to the invited user. This must have been created by the business owner earlier.',
    example: '3e93j5jf83ht59fj3hdb3u5ijw',
  })
  @IsNotEmpty({ message: 'Role ID is required' })
  @IsEmail()
  roleId!: Types.ObjectId;
}
