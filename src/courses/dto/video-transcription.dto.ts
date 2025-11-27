import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class ExtractTranscriptDto {
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  language?: string; // e.g., 'en-US', 'es-ES', 'fr-FR'
}

export class TranscriptResponseDto {
  lessonId: string;
  transcript: string;
  duration: number;
  language: string;
  wordCount: number;
  confidence: number;
  status: string;
  extractedAt: Date;
}

export class SaveTranscriptDto {
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  transcript: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @IsOptional()
  wordCount?: number;

  @IsNumber()
  @IsOptional()
  confidence?: number;
}

export class TranscriptSummaryDto {
  @IsString()
  @IsNotEmpty()
  transcript: string;
}

export class TranscriptSummaryResponseDto {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export class GetTranscriptResponseDto {
  lessonId: string;
  transcript: string;
  retrievedAt: Date;
}
