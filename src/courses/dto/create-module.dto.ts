import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ 
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  courseId: string;

  @ApiProperty({ 
    description: 'Module title',
    example: 'Module 1: Introduction to Async Programming'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Module description',
    example: 'Learn the basics of asynchronous programming in JavaScript',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Display order (sequence in course)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
