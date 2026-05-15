import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Permission } from '../../../../common/enums/permissions.enum';

export class CreateRoleDto {
  @ApiProperty({
    description: 'This is the name of the role to be created.',
    example: 'Manager',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'This describe the role that is being created.',
    example: 'This is going to the manager of the business.',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'These are the responsibilities(Permissions) that the person holding such role will have opportunity to carry out.',
    example: [Permission.create_product, Permission.update_product],
  })
  permissions!: Permission[];
}
