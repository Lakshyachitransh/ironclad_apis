import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateTenantAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  displayName: string;

  @IsString()
  @MinLength(8)
  password: string;
}
