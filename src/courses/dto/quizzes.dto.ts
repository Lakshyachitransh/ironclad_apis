import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

// Quiz DTOs
export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  attemptsAllowed?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  attemptsAllowed?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;
}

// Question DTOs
export class CreateQuizQuestionDto {
  @IsString()
  type: string; // 'multiple_choice' | 'true_false' | 'short_answer'

  @IsString()
  questionText: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  points?: number;
}

export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  points?: number;
}

// Option DTOs
export class CreateQuizOptionDto {
  @IsString()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class UpdateQuizOptionDto {
  @IsOptional()
  @IsString()
  optionText?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

// Attempt DTOs
export class SubmitQuizAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  selectedOption: string;
}

export class QuizAttemptResponseDto {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  percentage: number;
  status: string;
  startedAt: Date;
  completedAt: Date;
}
