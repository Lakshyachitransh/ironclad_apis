import { Injectable } from '@nestjs/common';

export interface ExerciseTemplateStructure {
  title: string;
  description: string;
  highlightedTexts: Array<{
    text: string;
    hint: string;
  }>;
  options?: Array<{
    id: string;
    text: string;
  }>;
  codeTemplate?: string;
  instructions?: string;
}

/**
 * Service to generate consistent exercise templates
 * Helps teachers create exercises without writing full text
 */
@Injectable()
export class ExerciseTemplateGeneratorService {
  /**
   * Generate a Bug Fix exercise template
   */
  generateBugFixTemplate(params: {
    title: string;
    buggyCode: string;
    hints: string[];
  }): ExerciseTemplateStructure {
    return {
      title: params.title,
      description: `Fix the bug in the provided code. Multiple hints are available to guide you.`,
      highlightedTexts: params.hints.map((hint, index) => ({
        text: `Bug ${index + 1}`,
        hint: hint,
      })),
      codeTemplate: params.buggyCode,
      instructions: `Review the code carefully. There are ${params.hints.length} bug(s) to fix. 
Use the highlighted sections as hints for where issues might be located.
Submit your corrected code when ready.`,
    };
  }

  /**
   * Generate a Code Completion exercise template
   */
  generateCodeCompletionTemplate(params: {
    title: string;
    incompleteCode: string;
    blanks: Array<{ position: number; hint: string }>;
  }): ExerciseTemplateStructure {
    return {
      title: params.title,
      description: `Complete the missing parts of the code based on the context and hints provided.`,
      highlightedTexts: params.blanks.map((blank, index) => ({
        text: `Blank ${index + 1}`,
        hint: blank.hint,
      })),
      codeTemplate: params.incompleteCode,
      instructions: `Complete the code by filling in the ${params.blanks.length} blank section(s).
Pay attention to the hints provided for each blank to understand what code should go there.
Make sure your code follows best practices and produces the expected output.`,
    };
  }

  /**
   * Generate a Code Refactoring exercise template
   */
  generateRefactoringTemplate(params: {
    title: string;
    workingCode: string;
    improvementAreas: string[];
  }): ExerciseTemplateStructure {
    return {
      title: params.title,
      description: `Refactor the provided code to follow best practices and improve readability.`,
      highlightedTexts: params.improvementAreas.map((area, index) => ({
        text: `Improvement ${index + 1}`,
        hint: area,
      })),
      codeTemplate: params.workingCode,
      instructions: `The provided code works correctly but can be improved. Consider the following areas:
${params.improvementAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

Refactor the code to address these areas while maintaining the same functionality.`,
    };
  }

  /**
   * Generate a Debug/Trace exercise template
   */
  generateDebugTemplate(params: {
    title: string;
    code: string;
    expectedBehavior: string;
    questions: string[];
  }): ExerciseTemplateStructure {
    return {
      title: params.title,
      description: `Debug the code and answer the provided questions about its execution.`,
      highlightedTexts: params.questions.map((q, index) => ({
        text: `Question ${index + 1}`,
        hint: q,
      })),
      options: params.questions.map((q, index) => ({
        id: `q${index}`,
        text: q,
      })),
      codeTemplate: params.code,
      instructions: `Trace through the provided code and answer the following questions:
${params.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Expected behavior: ${params.expectedBehavior}`,
    };
  }

  /**
   * Generate a Multiple Choice Code exercise template
   */
  generateMultipleChoiceCodeTemplate(params: {
    title: string;
    question: string;
    codeSnippet: string;
    options: Array<{ id: string; text: string; explanation: string }>;
  }): ExerciseTemplateStructure {
    return {
      title: params.title,
      description: `Select the correct answer based on the provided code snippet.`,
      highlightedTexts: params.options.map((opt) => ({
        text: opt.text,
        hint: opt.explanation,
      })),
      options: params.options.map(opt => ({
        id: opt.id,
        text: opt.text,
      })),
      codeTemplate: params.codeSnippet,
      instructions: `Question: ${params.question}

Review the code provided and select the correct answer from the options below.
Each option includes an explanation to help you understand why it is or isn't correct.`,
    };
  }

  /**
   * Merge template with specific exercise details
   */
  mergeTemplateWithExercise(
    template: ExerciseTemplateStructure,
    exerciseDetails: {
      title?: string;
      description?: string;
      instructions?: string;
      highlights?: Array<{ start: number; end: number; hint: string }>;
    },
  ): ExerciseTemplateStructure {
    return {
      ...template,
      title: exerciseDetails.title || template.title,
      description: exerciseDetails.description || template.description,
      instructions: exerciseDetails.instructions || template.instructions,
      highlightedTexts: exerciseDetails.highlights?.map(h => ({
        text: template.codeTemplate?.substring(h.start, h.end) || '',
        hint: h.hint,
      })) || template.highlightedTexts,
    };
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: ExerciseTemplateStructure): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.title || template.title.trim().length === 0) {
      errors.push('Template must have a title');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template must have a description');
    }

    if (!template.highlightedTexts || template.highlightedTexts.length === 0) {
      errors.push('Template must have at least one highlighted section');
    }

    if (template.highlightedTexts?.some(h => !h.text || !h.hint)) {
      errors.push('All highlighted sections must have both text and hint');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
