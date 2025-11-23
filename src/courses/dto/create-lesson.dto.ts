import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ 
    description: 'Module ID',
    example: 'mod-001'
  })
  @IsString()
  moduleId: string;

  @ApiProperty({ 
    description: 'Lesson title',
    example: 'Lesson 1: Getting Started'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Lesson description',
    example: 'Introduction to the topic',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Display order (sequence in module)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
