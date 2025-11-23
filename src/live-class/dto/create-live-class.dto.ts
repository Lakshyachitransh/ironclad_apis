import { IsString, IsISO8601, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLiveClassDto {
  @ApiProperty({ 
    description: 'Tenant name',
    example: 'Tech Academy'
  })
  @IsString()
  tenantName: string;

  @ApiProperty({ 
    description: 'Live class title',
    example: 'Advanced JavaScript Session - Live Q&A'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Live class description',
    example: 'Interactive Q&A session for advanced JavaScript concepts',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Scheduled start time (ISO 8601 format)',
    example: '2025-11-20T14:00:00Z'
  })
  @IsISO8601()
  scheduledAt: string;

  @ApiProperty({ 
    description: 'Maximum number of participants (default: 200, min: 10, max: 500)',
    example: 150,
    required: false,
    minimum: 10,
    maximum: 500
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  maxParticipants?: number;
}
