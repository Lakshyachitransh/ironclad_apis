import { IsString, IsNotEmpty } from 'class-validator';

export class TrackActivityDto {
  @IsString()
  @IsNotEmpty()
  liveClassId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RecordLeaveDto {
  @IsString()
  @IsNotEmpty()
  liveClassId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CalculateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  liveClassId: string;
}

export class AttendanceResponseDto {
  activeDurationSeconds: number;
  activePercentage: number;
  isCompleted: boolean;
  status: string;
  message: string;
}

export class AttendanceReportDto {
  liveClassId: string;
  title: string;
  totalClassDurationMinutes: number;
  summary: {
    totalParticipants: number;
    completedParticipants: number;
    incompletedParticipants: number;
    completionRate: number;
    averageAttendance: number;
  };
  participants: Array<{
    userId: string;
    activeDurationMinutes: number;
    activePercentage: number;
    isCompleted: boolean;
    status: string;
  }>;
}
