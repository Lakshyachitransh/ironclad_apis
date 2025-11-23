import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'org_admin' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Organization Administrator' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Full organization admin' , required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
