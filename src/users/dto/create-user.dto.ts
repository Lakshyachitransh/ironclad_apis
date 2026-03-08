import { IsEmail, IsString, IsOptional, MinLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  role: string; // Single role code (e.g., 'learner', 'trainer', 'tenant_admin')
}


