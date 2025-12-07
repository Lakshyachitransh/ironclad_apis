import { IsEmail, IsString, IsOptional, MinLength, IsArray } from 'class-validator';

export class CreatePlatformUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsArray()
  platformRoles?: string[];
}
