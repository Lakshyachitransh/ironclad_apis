import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreatePlatformUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  platformRole: string; // Single platform role code (e.g., 'platform_admin', 'platform_moderator', 'viewer')
}
