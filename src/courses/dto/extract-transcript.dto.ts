import { IsString, IsNotEmpty } from 'class-validator';

export class ExtractTranscriptDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class TranscriptSummaryDto {
  @IsString()
  @IsNotEmpty()
  transcript: string;
}
