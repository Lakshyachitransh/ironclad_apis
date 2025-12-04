import { IsString, IsNotEmpty } from 'class-validator';

export class AddLessonSummaryDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  summary: string;
}

export class GenerateQuizzesFromSummaryDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  summary: string;
}
