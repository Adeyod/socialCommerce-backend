import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AcceptRiderInviteDto {
  @ApiProperty({
    description:
      'This the token that the rider is going to submit when accepting.',
  })
  @IsString()
  token!: string;
}
