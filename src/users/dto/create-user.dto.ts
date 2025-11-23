import { IsEmail, IsString, IsOptional, MinLength, IsArray } from 'class-validator';

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
  tenantName: string;

  @IsOptional()
  @IsArray()
  roles?: string[];
}
