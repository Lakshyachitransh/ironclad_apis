import { IsString, IsNotEmpty, IsArray, IsNumber, Min, Max } from 'class-validator';

export class GenerateQuizFromVideoDto {
  @IsString()
  @IsNotEmpty()
  videoContent: string;

  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class SubmitQuizAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  selectedOptionId: string;
}

export class SubmitQuizAttemptDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsArray()
  @IsNotEmpty()
  answers: SubmitQuizAnswerDto[];
}

export class QuizResponseDto {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  questionCount: number;
  questions: QuestionResponseDto[];
}

export class QuestionResponseDto {
  id: string;
  questionText: string;
  explanation: string;
  order: number;
  options: OptionResponseDto[];
}

export class OptionResponseDto {
  id: string;
  optionText: string;
  order: number;
}
