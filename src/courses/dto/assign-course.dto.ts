import { IsString, IsUUID, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCourseDto {
  @ApiProperty({ 
    description: 'Tenant ID',
    example: '456e7890-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'Course ID to assign',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  courseId: string;

  @ApiProperty({ 
    description: 'User IDs to assign the course to',
    example: ['user-id-1', 'user-id-2'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  assignToUserIds: string[];

  @ApiProperty({ 
    description: 'Due date for course completion (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class AssignBulkCourseDto {
  @ApiProperty({ 
    description: 'Tenant ID',
    example: '456e7890-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ 
    description: 'Course IDs to assign',
    example: ['course-id-1', 'course-id-2'],
    type: [String]
  })
  @IsArray()
  @IsUUID('all', { each: true })
  courseIds: string[];

  @ApiProperty({ 
    description: 'User IDs to assign courses to',
    example: ['user-id-1', 'user-id-2'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  assignToUserIds: string[];

  @ApiProperty({ 
    description: 'Due date for course completion (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
