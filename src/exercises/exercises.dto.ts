import { IsString, IsOptional, IsArray, IsJSON, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExerciseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum ExerciseCategory {
  BUG_FIX = 'bug-fix',
  CODE_COMPLETION = 'code-completion',
  CODE_REFACTORING = 'code-refactoring',
  DEBUG = 'debug',
}

export class HighlightedSection {
  @ApiProperty({
    description: 'Start position',
    example: 5
  })
  start: number;

  @ApiProperty({
    description: 'End position',
    example: 25
  })
  end: number;

  @ApiProperty({
    description: 'Hint for this section',
    example: 'This is where the bug is',
    required: false
  })
  hint?: string;

  @ApiProperty({
    description: 'Explanation for this section',
    example: 'This variable should be initialized before use',
    required: false
  })
  explanation?: string;
}

export class MultipleChoiceOption {
  @ApiProperty({
    description: 'Option ID',
    example: 'opt-1'
  })
  id: string;

  @ApiProperty({
    description: 'Option text',
    example: 'The array method that returns a new array with filtered elements'
  })
  text: string;

  @ApiProperty({
    description: 'Whether this is the correct option',
    example: true
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Explanation for this option',
    example: 'filter() creates a new array with elements that pass the test',
    required: false
  })
  explanation?: string;
}

export class TestCase {
  @ApiProperty({
    description: 'Test input',
    example: '[1, 2, 3, 4, 5]',
    required: false
  })
  input?: string;

  @ApiProperty({
    description: 'Expected output',
    example: '[2, 4]'
  })
  expectedOutput: string;

  @ApiProperty({
    description: 'Whether test case is hidden from student',
    example: false,
    required: false
  })
  hidden?: boolean;
}

export class CreateExerciseTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Bug Fix Exercise Template'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Template for creating bug fixing exercises',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Template category',
    enum: ExerciseCategory,
    example: ExerciseCategory.BUG_FIX
  })
  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @ApiProperty({
    description: 'Template structure as JSON string',
    example: '{"type":"bug-fix","title":"Title","buggyCode":"code","hints":["hint1"]}'
  })
  @IsString()
  structure: string;
}

export class CreateExerciseDto {
  @ApiProperty({
    description: 'Lesson ID this exercise belongs to',
    example: 'lesson-uuid-123'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: 'Optional template to use',
    example: 'template-uuid-456',
    required: false
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({
    description: 'Exercise title',
    example: 'Fix the Login Authentication Bug'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Exercise description',
    example: 'Debug and fix the authentication logic',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'How to complete the exercise',
    example: 'The login function is not working correctly. Find and fix the bug. Make sure to handle edge cases.'
  })
  @IsString()
  instructions: string;

  @ApiProperty({
    description: 'Exercise difficulty level',
    enum: ExerciseDifficulty,
    example: ExerciseDifficulty.INTERMEDIATE
  })
  @IsEnum(ExerciseDifficulty)
  difficulty: ExerciseDifficulty;

  @ApiProperty({
    description: 'Exercise category',
    enum: ExerciseCategory,
    example: ExerciseCategory.BUG_FIX
  })
  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @ApiProperty({
    description: 'Initial code provided to student',
    example: 'function login(email, password) {\n  if (user = email) {\n    if (pwd == password) {\n      return { success: true };\n    }\n  }\n  return { success: false };\n}'
  })
  @IsString()
  startingCode: string;

  @ApiProperty({
    description: 'What the correct output should be',
    example: 'Should return success: true only with correct credentials',
    required: false
  })
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiProperty({
    description: 'JSON string array of test cases',
    example: '[{"input": "test@example.com, pass123", "expectedOutput": "success: true"}, {"input": "wrong@example.com, wrong", "expectedOutput": "success: false"}]'
  })
  @IsString()
  testCases: string;

  @ApiProperty({
    description: 'JSON string array of highlighted sections with hints',
    example: '[{"start": 20, "end": 25, "hint": "Check the comparison operator"}, {"start": 30, "end": 40, "hint": "Verify the password check"}]'
  })
  @IsString()
  highlightedSections: string;

  @ApiProperty({
    description: 'JSON string array of multiple choice options',
    example: '[{"id": "opt-1", "text": "Use == for comparison", "isCorrect": true}, {"id": "opt-2", "text": "Use = for comparison", "isCorrect": false}]',
    required: false
  })
  @IsOptional()
  @IsString()
  multipleChoiceOptions?: string;
}

export class UpdateExerciseDto {
  @ApiProperty({
    description: 'Exercise title',
    example: 'Updated Exercise Title',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Exercise description',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Exercise instructions',
    required: false
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ExerciseDifficulty,
    required: false
  })
  @IsOptional()
  @IsEnum(ExerciseDifficulty)
  difficulty?: ExerciseDifficulty;

  @ApiProperty({
    description: 'Starting code',
    required: false
  })
  @IsOptional()
  @IsString()
  startingCode?: string;

  @ApiProperty({
    description: 'Expected output',
    required: false
  })
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiProperty({
    description: 'Test cases as JSON string',
    required: false
  })
  @IsOptional()
  @IsString()
  testCases?: string;

  @ApiProperty({
    description: 'Highlighted sections as JSON string',
    required: false
  })
  @IsOptional()
  @IsString()
  highlightedSections?: string;

  @ApiProperty({
    description: 'Multiple choice options as JSON string',
    required: false
  })
  @IsOptional()
  @IsString()
  multipleChoiceOptions?: string;

  @ApiProperty({
    description: 'Exercise status',
    example: 'published',
    required: false
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SubmitExerciseDto {
  @ApiProperty({
    description: 'The code submitted by student',
    example: 'function login(email, password) {\n  if (user == email) {\n    if (password == password) {\n      return { success: true };\n    }\n  }\n  return { success: false };\n}'
  })
  @IsString()
  submittedCode: string;

  @ApiProperty({
    description: 'Selected option for multiple choice exercises',
    example: 'option-2',
    required: false
  })
  @IsOptional()
  @IsString()
  selectedOption?: string;

  @ApiProperty({
    description: 'Expected output',
    example: 'success: true',
    required: false
  })
  @IsOptional()
  @IsString()
  output?: string;
}

export class GenerateExerciseFromTemplateDto {
  @ApiProperty({
    description: 'Template ID to use',
    example: 'template-uuid-123'
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Lesson ID',
    example: 'lesson-uuid-123'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: 'Exercise title',
    example: 'Debug the Sorting Algorithm'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Exercise description',
    example: 'Fix the sorting bug',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ExerciseDifficulty,
    example: ExerciseDifficulty.INTERMEDIATE
  })
  @IsEnum(ExerciseDifficulty)
  difficulty: ExerciseDifficulty;

  @ApiProperty({
    description: 'Starting code',
    example: 'function sort(arr) {\n  for(let i=0; i<arr.length-1; i++) {\n    for(let j=0; j<arr.length-i-1; j++) {\n      if (arr[j] < arr[j+1]) {\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}'
  })
  @IsString()
  startingCode: string;

  @ApiProperty({
    description: 'Expected output',
    example: '[1,2,3,4,5]'
  })
  @IsString()
  expectedOutput: string;

  @ApiProperty({
    description: 'Test cases as JSON string',
    example: '[{"input": "[5,2,8,1,9]", "expectedOutput": "[1,2,5,8,9]"}]'
  })
  @IsString()
  testCases: string;
}

export class GenerateExercisesFromCourseDto {
  @ApiProperty({
    description: 'Course ID to generate exercises from',
    example: '956296e4-91b4-460e-a928-2ffbb7903c22'
  })
  @IsString()
  courseId: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'cf9c2a89-6cde-4e8b-9e53-c6e8f2e2811c'
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Difficulty level for exercises',
    enum: ExerciseDifficulty,
    example: ExerciseDifficulty.BEGINNER
  })
  @IsEnum(ExerciseDifficulty)
  difficulty: ExerciseDifficulty;

  @ApiProperty({
    description: 'Exercise category',
    enum: ExerciseCategory,
    example: ExerciseCategory.CODE_COMPLETION
  })
  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @ApiProperty({
    description: 'Number of exercises to generate',
    example: 3,
    required: false
  })
  @IsOptional()
  count?: number;

  @ApiProperty({
    description: 'Specific lesson ID to focus on (optional)',
    example: '93c17d6e-1e77-43fb-8e01-8d0b2b2cbfba',
    required: false
  })
  @IsOptional()
  @IsString()
  lessonId?: string;
}

