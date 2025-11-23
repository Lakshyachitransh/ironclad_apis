import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'tenants.create' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Create tenants' })
  @IsString()
  description: string;
}
