import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ 
    description: 'Tenant ID',
    example: '456e7890-e89b-12d3-a456-426614174000'
  })
  @IsString()
  tenantId: string;

  @ApiProperty({ 
    description: 'Course title',
    minLength: 3,
    example: 'Advanced JavaScript Mastery'
  })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ 
    description: 'Course summary or description',
    example: 'Learn advanced concepts in JavaScript including async/await, promises, and more',
    required: false
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ 
    description: 'Course level (Beginner, Intermediate, Advanced)',
    example: 'Advanced',
    required: false
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ 
    description: 'Owner user ID',
    example: '789f0123-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}
