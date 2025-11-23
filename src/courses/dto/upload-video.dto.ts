import { IsString, IsOptional, IsInt } from 'class-validator';

export class UploadVideoDto {
  @IsString()
  lessonId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  videoDuration?: number; // duration in seconds
}
