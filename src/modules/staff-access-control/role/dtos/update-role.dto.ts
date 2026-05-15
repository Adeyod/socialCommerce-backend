import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Permission } from '../../../../common/enums/permissions.enum';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Updated name of the role',
    example: 'Senior Manager',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the role',
    example: 'Handles senior management operations',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated permissions assigned to this role',
    example: [Permission.create_product, Permission.update_product],
  })
  @IsOptional()
  @IsArray()
  permissions?: Permission[];
}
