import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Name of the tenant (must be unique)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Status of the tenant (defaults to active)',
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
