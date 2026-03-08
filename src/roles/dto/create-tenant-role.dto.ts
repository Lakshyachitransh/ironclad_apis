import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantRoleDto {
  @ApiProperty({
    description: 'Role code (unique within tenant)',
    example: 'course_manager',
    minLength: 3,
    maxLength: 50
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  roleCode: string;

  @ApiProperty({
    description: 'Human-readable role name',
    example: 'Course Manager',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  roleName: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Can create and manage courses for the tenant',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
