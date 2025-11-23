import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    description: 'Email address for the new account',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Password (minimum 8 characters)',
    minLength: 8,
    example: 'SecurePass123!'
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    description: 'Display name (optional)',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}
