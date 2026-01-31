import { IsString, IsOptional, IsArray, IsEnum, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TutorQuestionType {
  CONCEPT = 'concept',
  DEBUGGING = 'debugging',
  OPTIMIZATION = 'optimization',
  BEST_PRACTICES = 'best-practices',
  GENERAL = 'general',
}

export class AskTutorQuestionDto {
  @ApiProperty({
    description: 'The question to ask',
    example: 'What is a callback function in JavaScript?'
  })
  @IsString()
  question: string;

  @ApiProperty({
    description: 'Code or exercise context',
    example: 'I am learning about asynchronous JavaScript',
    required: false
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({
    description: 'Question type',
    enum: TutorQuestionType,
    example: TutorQuestionType.CONCEPT,
    required: false
  })
  @IsOptional()
  @IsEnum(TutorQuestionType)
  questionType?: TutorQuestionType;

  @ApiProperty({
    description: 'Related exercise ID',
    example: 'exercise-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  exerciseId?: string;
}

export class GenerateExerciseDynamicDto {
  @ApiProperty({
    description: 'Topic to generate exercise on',
    example: 'async and await'
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'intermediate'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @ApiProperty({
    description: 'Exercise category',
    enum: ['bug-fix', 'code-completion', 'code-refactoring', 'debug'],
    example: 'code-completion',
    required: false
  })
  @IsOptional()
  @IsEnum(['bug-fix', 'code-completion', 'code-refactoring', 'debug'])
  category?: string;

  @ApiProperty({
    description: 'Exercise description',
    example: 'Learn async/await patterns and promise handling',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'javascript',
    required: false
  })
  @IsOptional()
  @IsString()
  programmingLanguage?: string;

  @ApiProperty({
    description: 'Programming language (alias)',
    example: 'javascript',
    required: false
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Lesson ID',
    example: 'lesson-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({
    description: 'Course ID',
    example: '8b7bc0ee-aac7-4b53-809d-1f893de0e439',
    required: false
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({
    description: 'Course ID (snake_case)',
    example: '8b7bc0ee-aac7-4b53-809d-1f893de0e439',
    required: false
  })
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiProperty({
    description: 'Tenant ID (required for platform_admin)',
    example: '5c82d4af-2ef8-4b97-bb18-8ed6bbaff373',
    required: false
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class AnalyzeStudentProgressDto {
  @ApiProperty({
    description: 'Student user ID',
    example: 'user-uuid-123'
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Lesson ID for progress analysis',
    example: 'lesson-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({
    description: 'Course ID for progress analysis',
    example: 'course-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  courseId?: string;
}

export class GeneratePersonalizedExerciseDto {
  @ApiProperty({
    description: 'Student user ID',
    example: 'user-uuid-123'
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Lesson ID to generate exercise for',
    example: 'lesson-uuid-123'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: 'Weak areas for student',
    example: ['async-await', 'error-handling'],
    required: false
  })
  @IsOptional()
  @IsArray()
  weakAreas?: string[];

  @ApiProperty({
    description: 'Exercise difficulty',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'intermediate'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: string;
}

export class ReviewCodeSubmissionDto {
  @ApiProperty({
    description: 'Code submission ID to review',
    example: 'submission-uuid-123'
  })
  @IsString()
  submissionId: string;

  @ApiProperty({
    description: 'Additional context for review',
    example: 'Student mentioned struggling with recursion',
    required: false
  })
  @IsOptional()
  @IsString()
  additionalContext?: string;
}

export class CompareCodeSolutionsDto {
  @ApiProperty({
    description: 'Student code',
    example: 'function sum(arr) {\n  let total = 0;\n  for(let i = 0; i < arr.length; i++) {\n    total = total + arr[i];\n  }\n  return total;\n}'
  })
  @IsString()
  studentCode: string;

  @ApiProperty({
    description: 'Reference code',
    example: 'function sum(arr) {\n  return arr.reduce((acc, val) => acc + val, 0);\n}'
  })
  @IsString()
  referenceCode: string;

  @ApiProperty({
    description: 'Exercise title',
    example: 'Calculate Array Sum'
  })
  @IsString()
  exerciseTitle: string;

  @ApiProperty({
    description: 'Expected output',
    example: 'Return the sum of all array elements',
    required: false
  })
  @IsOptional()
  @IsString()
  expectedOutput?: string;
}

export class GenerateInteractiveQuizDto {
  @ApiProperty({
    description: 'Topic or code snippet to generate quiz on',
    example: 'JavaScript promises and async/await'
  })
  @IsString()
  topicOrCode: string;

  @ApiProperty({
    description: 'Quiz difficulty level',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'intermediate'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @ApiProperty({
    description: 'Related exercise ID',
    example: 'exercise-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  exerciseId?: string;

  @ApiProperty({
    description: 'Number of quiz questions',
    example: 5,
    required: false
  })
  @IsOptional()
  numberOfQuestions?: number;
}

export class DebugAssistanceDto {
  @ApiProperty({
    description: 'Error message',
    example: 'TypeError: Cannot read property "length" of undefined'
  })
  @IsString()
  errorMessage: string;

  @ApiProperty({
    description: 'Code that caused the error',
    example: 'function getLength(str) {\n  return str.length;\n}\n\ngetLength(null);'
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Stack trace',
    example: 'at getLength (file.js:2:20)\nat Object.<anonymous> (file.js:5:8)',
    required: false
  })
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'javascript'
  })
  @IsString()
  programmingLanguage: string;
}

export class GenerateCodeExplanationDto {
  @ApiProperty({
    description: 'Code to explain',
    example: 'const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);'
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'javascript'
  })
  @IsString()
  programmingLanguage: string;

  @ApiProperty({
    description: 'Detail level of explanation',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'beginner'
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  detailLevel: string;

  @ApiProperty({
    description: 'Specific part of code to explain',
    example: 'const filtered = arr.filter(x => x > 5);',
    required: false
  })
  @IsOptional()
  @IsString()
  specificPart?: string;
}

// Conversation DTOs
export class CreateConversationDto {
  @ApiProperty({
    description: 'Course ID for conversation context',
    example: 'course-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({
    description: 'Lesson ID for conversation context',
    example: 'lesson-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({
    description: 'Topic of conversation',
    example: 'JavaScript async/await',
    required: false
  })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class AddMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'How do I use async/await in JavaScript?'
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Message role',
    enum: ['user', 'assistant'],
    example: 'user'
  })
  @IsEnum(['user', 'assistant'])
  role: string;

  @ApiProperty({
    description: 'Message metadata',
    example: { confidence: 0.95, sources: ['MDN', 'JavaScript.info'] },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// Highlight DTOs
export class CreateHighlightDto {
  @ApiProperty({
    description: 'Lesson ID to highlight in',
    example: 'lesson-uuid-123'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: 'Text to highlight',
    example: 'Async functions always return a promise'
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Start position in text',
    example: 0,
    required: false
  })
  @IsOptional()
  startPosition?: number;

  @ApiProperty({
    description: 'End position in text',
    example: 50,
    required: false
  })
  @IsOptional()
  endPosition?: number;

  @ApiProperty({
    description: 'Highlight color',
    example: 'yellow',
    required: false
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Notes about highlight',
    example: 'Important concept for async programming',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateHighlightDto {
  @ApiProperty({
    description: 'Highlight color',
    example: 'green',
    required: false
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Notes about highlight',
    example: 'Updated notes',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

