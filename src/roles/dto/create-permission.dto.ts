import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'tenants.create', description: 'Permission code (format: resource.action)' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Create tenants', description: 'Permission name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'tenants', description: 'Resource name' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'create', description: 'Action name' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'Tenant Management', description: 'Permission category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Create new tenants', description: 'Permission description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  // Keep backwards compatibility
  @IsOptional()
  id?: string;
}

