import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'tenant-uuid' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: ['org_admin'] })
  @IsArray()
  @ArrayNotEmpty()
  roles: string[]; // tenant-scoped roles stored in user_tenants.roles
}
