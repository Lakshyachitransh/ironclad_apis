import { IsArray, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUsersToLiveClassDto {
  @ApiProperty({
    description: 'Array of user IDs to assign to the live class',
    type: [String],
    example: ['user-id-1', 'user-id-2', 'user-id-3'],
    minimum: 1
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID must be provided' })
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Role for assigned users (participant or teacher)',
    example: 'participant',
    enum: ['participant', 'teacher'],
    default: 'participant',
    required: false
  })
  @IsString()
  role?: string;
}
