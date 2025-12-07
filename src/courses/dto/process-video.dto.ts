import { IsString, IsUrl } from 'class-validator';

export class ProcessVideoUrlDto {
  @IsUrl()
  videoUrl: string;

  @IsString()
  videoTitle: string;

  @IsString()
  lessonId: string;

  @IsString()
  courseId: string;

  @IsString()
  tenantId: string;
}

export class GenerateVideoSummaryDto {
  @IsUrl()
  videoUrl: string;

  @IsString()
  videoTitle: string;
}

export class GenerateQuizFromVideoDto {
  @IsUrl()
  videoUrl: string;

  @IsString()
  videoTitle: string;

  @IsString()
  lessonId: string;

  @IsString()
  courseId: string;

  @IsString()
  tenantId: string;
}
