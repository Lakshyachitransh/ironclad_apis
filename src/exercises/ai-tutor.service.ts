import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface AIFeedbackResponse {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
  commonMistakes: string[];
  nextSteps: string[];
}

export interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string;
  startingCode: string;
  expectedOutput: string;
  testCases: Array<{ input?: string; expectedOutput: string }>;
  highlightedSections: Array<{ hint: string; explanation: string }>;
  difficulty: string;
}

export interface StudentProgress {
  totalExercises: number;
  completed: number;
  successRate: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendedTopics: string[];
}

export interface CodeComparison {
  similarities: string[];
  differences: string[];
  improvements: string[];
  codeSmellsDetected: string[];
  performanceAnalysis: string;
}

export interface DebugSolution {
  errorExplanation: string;
  rootCause: string;
  solution: string;
  codeExample: string;
  preventionTips: string[];
}

/**
 * Comprehensive AI Tutor Service
 * Handles: exercise generation, code evaluation, question answering, 
 * student progress tracking, and interactive tutoring
 */
@Injectable()
export class AITutorService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Minify JSON by removing all unnecessary whitespace outside of string values
   * This fixes issues with literal newlines in formatted JSON
   */
  private minifyJSON(jsonString: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      const nextChar = jsonString[i + 1];

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        result += char;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }

      if (inString) {
        // Inside strings, keep everything except actual newlines/tabs (but keep escaped versions)
        // Replace literal control characters with their escape sequences
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char.charCodeAt(0) < 32 && char !== '\t') {
          // Skip other control characters
          continue;
        } else {
          result += char;
        }
        continue;
      }

      // Outside strings, skip whitespace
      if (/\s/.test(char)) {
        continue;
      }

      result += char;
    }

    return result;
  }

  /**
   * Sanitize JSON string by escaping control characters
   * Handles unescaped newlines, tabs, and other control characters in string values
   */
  private sanitizeJSON(jsonString: string): string {
    // First minify to remove formatting whitespace
    return this.minifyJSON(jsonString);
  }

  /**
   * Extract valid JSON from AI response, handling various formatting issues
   */
  private extractValidJSON(content: string): string | null {
    // Remove optional markdown code block markers
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();

    // Try to find the first complete JSON object
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let jsonStart = -1;
    let jsonEnd = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            jsonStart = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && jsonStart !== -1) {
            jsonEnd = i;
            break;
          }
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      return cleaned.substring(jsonStart, jsonEnd + 1);
    }

    return null;
  }

  /**
   * Evaluate student code and provide AI-generated feedback
   */
  async evaluateCodeSubmission(params: {
    studentCode: string;
    expectedCode?: string;
    testResults: Array<{ testId: string; passed: boolean; error?: string }>;
    instructions: string;
    difficulty: string;
    category: string;
  }): Promise<AIFeedbackResponse> {
    const prompt = this.buildEvaluationPrompt(params);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert programming tutor. Your role is to:
1. Evaluate student code submissions
2. Provide constructive, encouraging feedback
3. Identify common mistakes
4. Suggest improvements
5. Guide students to think critically

Always be positive and encouraging. Focus on learning outcomes.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return this.parseAIFeedback(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Fallback to rule-based feedback if API fails
      return this.generateFallbackFeedback(params);
    }
  }

  /**
   * Generate hints for struggling students
   */
  async generateHint(params: {
    exerciseTitle: string;
    studentCode: string;
    highlightedHints: string[];
    category: string;
  }): Promise<string> {
    const prompt = `
The student is working on: "${params.exerciseTitle}"
Category: ${params.category}

Their current code:
\`\`\`
${params.studentCode}
\`\`\`

Available hints:
${params.highlightedHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}

The student is asking for help. Provide ONE specific, guiding hint that helps them think through the problem without giving away the solution. 
Make it conversational and encouraging. Keep it to 2-3 sentences.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful programming tutor. Provide hints that guide students without giving away solutions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0].message.content || 'Think about what the code is supposed to do.';
    } catch (error) {
      console.error('Error generating hint:', error);
      return 'Consider reviewing the highlighted sections and hints provided in the exercise.';
    }
  }

  /**
   * Generate detailed explanations for concepts
   */
  async explainConcept(params: {
    concept: string;
    difficulty: string;
    codeExample?: string;
  }): Promise<string> {
    const prompt = `
Explain the concept of "${params.concept}" at a ${params.difficulty} level.
${params.codeExample ? `Here's a code example:\n\`\`\`\n${params.codeExample}\n\`\`\`` : ''}

Provide a clear, concise explanation with:
1. What it is
2. Why it matters
3. How to use it

Keep the explanation to 3-4 paragraphs maximum.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert programming educator. Explain concepts clearly and concisely.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || 'Unable to generate explanation at this time.';
    } catch (error) {
      console.error('Error explaining concept:', error);
      return 'Please refer to the lesson materials and hints provided in the exercise.';
    }
  }

  /**
   * Identify common mistakes in student code
   */
  async identifyMistakes(params: {
    studentCode: string;
    category: string;
    difficulty: string;
  }): Promise<string[]> {
    const prompt = `
Analyze this ${params.difficulty} level code and identify up to 5 common mistakes:

\`\`\`
${params.studentCode}
\`\`\`

Exercise category: ${params.category}

Return ONLY a JSON array of strings, each being a specific mistake found in the code.
If no mistakes, return empty array.
Format: ["mistake1", "mistake2", ...]`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a code reviewer. Identify specific, actionable mistakes in code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      try {
        const content = completion.choices[0].message.content || '[]';
        return JSON.parse(this.sanitizeJSON(content));
      } catch (parseError) {
        return [];
      }
    } catch (error) {
      console.error('Error identifying mistakes:', error);
      return [];
    }
  }

  private buildEvaluationPrompt(params: {
    studentCode: string;
    expectedCode?: string;
    testResults: Array<{ testId: string; passed: boolean; error?: string }>;
    instructions: string;
    difficulty: string;
    category: string;
  }): string {
    const failedTests = params.testResults.filter(t => !t.passed);
    const passedTests = params.testResults.filter(t => t.passed);

    return `
Exercise Instructions:
${params.instructions}

Difficulty: ${params.difficulty}
Category: ${params.category}

Student's Code:
\`\`\`
${params.studentCode}
\`\`\`

${params.expectedCode ? `Expected/Reference Code:\n\`\`\`\n${params.expectedCode}\n\`\`\`` : ''}

Test Results:
- Passed: ${passedTests.length}/${params.testResults.length}
- Failed Tests: ${failedTests.map(t => t.error || t.testId).join(', ') || 'None'}

Please provide feedback in JSON format with these fields:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "main feedback message",
  "suggestions": ["suggestion1", "suggestion2"],
  "commonMistakes": ["mistake1", "mistake2"],
  "nextSteps": ["step1", "step2"]
}

Be encouraging and constructive. Focus on learning.`;
  }

  private parseAIFeedback(content: string): AIFeedbackResponse {
    try {
      // Extract JSON from content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(this.sanitizeJSON(jsonMatch[0]));
        return {
          isCorrect: parsed.isCorrect || false,
          score: parsed.score || 0,
          feedback: parsed.feedback || 'No feedback available',
          suggestions: parsed.suggestions || [],
          commonMistakes: parsed.commonMistakes || [],
          nextSteps: parsed.nextSteps || [],
        };
      }
    } catch (error) {
      console.error('Error parsing AI feedback:', error);
    }

    return {
      isCorrect: false,
      score: 0,
      feedback: 'Unable to parse feedback response',
      suggestions: [],
      commonMistakes: [],
      nextSteps: [],
    };
  }

  private generateFallbackFeedback(params: {
    studentCode: string;
    testResults: Array<{ testId: string; passed: boolean; error?: string }>;
    instructions: string;
    difficulty: string;
    category: string;
  }): AIFeedbackResponse {
    const passedCount = params.testResults.filter(t => t.passed).length;
    const totalCount = params.testResults.length;
    const score = Math.round((passedCount / totalCount) * 100);

    return {
      isCorrect: score === 100,
      score,
      feedback: `You passed ${passedCount} out of ${totalCount} test cases. ${score === 100 ? 'Great job! Your solution is correct.' : 'Keep working on this - there are still some test cases to fix.'}`,
      suggestions: [
        'Review the failed test cases',
        'Check edge cases in your code',
        'Verify your logic step by step',
      ],
      commonMistakes: params.testResults
        .filter(t => !t.passed && t.error)
        .map(t => t.error || 'Test failed'),
      nextSteps: [
        'Debug the failing test cases',
        'Run through the logic manually',
        'Consider edge cases you might have missed',
      ],
    };
  }

  /**
   * Answer student questions about programming concepts
   */
  async answerStudentQuestion(params: {
    question: string;
    context?: string;
    difficulty: string;
  }): Promise<string> {
    const prompt = `A student is asking a programming question. 
Context: ${params.context || 'General programming'}
Difficulty Level: ${params.difficulty}

Question: ${params.question}

Provide a clear, educational answer that:
1. Explains the concept
2. Provides a code example if relevant
3. Gives practical tips
4. Encourages further learning

Keep the answer concise and appropriate for their level.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a patient and knowledgeable programming tutor helping students learn.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0].message.content || 'Unable to answer question at this time.';
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Sorry, I could not generate an answer. Please try again or ask your instructor.';
    }
  }

  /**
   * Dynamically generate exercises based on topic
   */
  async generateExerciseDynamic(params: {
    topic: string;
    difficulty: string;
    category: string;
    description?: string;
    programmingLanguage?: string;
  }): Promise<GeneratedExercise> {
    const prompt = `You are an expert programming instructor. Generate a ${params.difficulty} level programming exercise.

TOPIC: "${params.topic}"
CATEGORY: ${params.category}
PROGRAMMING LANGUAGE: ${params.programmingLanguage || 'JavaScript'}
${params.description ? `ADDITIONAL CONTEXT: ${params.description}` : ''}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object, no other text
- Do not use markdown code blocks
- Ensure all string values are properly escaped
- Do not include any newlines inside string values
- If you must include line breaks in strings, use \\n escape sequence

Return EXACTLY this JSON structure:
{
  "title": "Clear, concise exercise title",
  "description": "What the student will learn in a few sentences",
  "instructions": "Step-by-step instructions without newlines",
  "startingCode": "Initial code template",
  "expectedOutput": "Expected output from correct solution",
  "testCases": [
    {"input": "test input 1", "expectedOutput": "expected output 1"},
    {"input": "test input 2", "expectedOutput": "expected output 2"}
  ],
  "highlightedSections": [
    {"hint": "First hint", "explanation": "Explanation of the hint"},
    {"hint": "Second hint", "explanation": "Another hint"}
  ]
}

Remember: Output ONLY the JSON object, no other text before or after.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert programming instructor creating educational exercises.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = completion.choices[0].message.content || '';
      
      if (!content) {
        throw new Error('AI returned empty response');
      }
      
      // Log the raw content for debugging
      console.log('Raw AI response (first 500 chars):', content.substring(0, 500));
      
      // Extract JSON more carefully
      const jsonStr = this.extractValidJSON(content);
      if (!jsonStr) {
        console.error('No valid JSON object found in response. Content:', content.substring(0, 500));
        throw new Error('AI response does not contain valid JSON object');
      }
      
      console.log('Extracted JSON (first 300 chars):', jsonStr.substring(0, 300));
      
      try {
        // Sanitize and parse the JSON
        const sanitized = this.sanitizeJSON(jsonStr);
        const exercise = JSON.parse(sanitized);
        
        if (!exercise || typeof exercise !== 'object') {
          throw new Error('Parsed JSON is not an object');
        }
        
        return {
          ...exercise,
          difficulty: params.difficulty,
        };
      } catch (parseError) {
        console.error('Failed to parse JSON:', {
          error: parseError,
          jsonLength: jsonStr.length,
          jsonPreview: jsonStr.substring(0, 200),
        });
        throw parseError;
      }
    } catch (error) {
      console.error('Error generating exercise:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to generate exercise: ' + errorMsg);
    }
  }

  /**
   * Analyze student progress and identify weak areas
   */
  async analyzeStudentProgress(params: {
    userId: string;
    submissions: Array<{
      exerciseTitle: string;
      category: string;
      score: number;
      feedback?: string;
    }>;
  }): Promise<StudentProgress> {
    const completedExercises = params.submissions.filter(s => s.score >= 70);
    const categories: { [key: string]: number[] } = {};

    params.submissions.forEach(s => {
      if (!categories[s.category]) categories[s.category] = [];
      categories[s.category].push(s.score);
    });

    const weakAreas = Object.entries(categories)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 70)
      .map(([cat]) => cat);

    const strongAreas = Object.entries(categories)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length >= 80)
      .map(([cat]) => cat);

    const avgScore =
      params.submissions.length > 0
        ? params.submissions.reduce((a, b) => a + b.score, 0) / params.submissions.length
        : 0;

    const prompt = `Based on a student's performance:
- Total exercises: ${params.submissions.length}
- Completed (70%+): ${completedExercises.length}
- Success rate: ${Math.round((completedExercises.length / params.submissions.length) * 100)}%
- Weak areas: ${weakAreas.join(', ') || 'None identified'}
- Strong areas: ${strongAreas.join(', ') || 'None identified'}
- Average score: ${Math.round(avgScore)}%

Return a JSON object with recommended topics to focus on next:
{
  "recommendedTopics": ["topic1", "topic2", "topic3"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an educational AI that recommends learning paths.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      const content = completion.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const recommendedTopics = jsonMatch ? JSON.parse(this.sanitizeJSON(jsonMatch[0])).recommendedTopics : [];

      return {
        totalExercises: params.submissions.length,
        completed: completedExercises.length,
        successRate: Math.round((completedExercises.length / params.submissions.length) * 100),
        weakAreas,
        strongAreas,
        recommendedTopics,
      };
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return {
        totalExercises: params.submissions.length,
        completed: completedExercises.length,
        successRate: Math.round((completedExercises.length / params.submissions.length) * 100),
        weakAreas,
        strongAreas,
        recommendedTopics: ['Keep practicing the fundamentals'],
      };
    }
  }

  /**
   * Compare student solution with reference solution
   */
  async compareCodeSolutions(params: {
    studentCode: string;
    referenceCode: string;
    exerciseTitle: string;
    expectedOutput?: string;
  }): Promise<CodeComparison> {
    const prompt = `Compare these two code solutions for: "${params.exerciseTitle}"

Student's Code:
\`\`\`
${params.studentCode}
\`\`\`

Reference Code:
\`\`\`
${params.referenceCode}
\`\`\`

${params.expectedOutput ? `Expected Output: ${params.expectedOutput}` : ''}

Analyze and provide JSON response:
{
  "similarities": ["similarity1", "similarity2"],
  "differences": ["difference1", "difference2"],
  "improvements": ["improvement suggestion 1", "improvement 2"],
  "codeSmellsDetected": ["issue1", "issue2"],
  "performanceAnalysis": "Brief analysis of performance differences"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a code review expert comparing programming solutions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
      });

      const content = completion.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(this.sanitizeJSON(jsonMatch[0]));
      }

      throw new Error('Could not parse comparison');
    } catch (error) {
      console.error('Error comparing solutions:', error);
      return {
        similarities: [],
        differences: [],
        improvements: ['Unable to compare - please review manually'],
        codeSmellsDetected: [],
        performanceAnalysis: 'Analysis unavailable',
      };
    }
  }

  /**
   * Provide debugging assistance
   */
  async debugAssistance(params: {
    errorMessage: string;
    code: string;
    stackTrace?: string;
    programmingLanguage: string;
  }): Promise<DebugSolution> {
    const prompt = `A student encountered an error in ${params.programmingLanguage}:

Error: ${params.errorMessage}
${params.stackTrace ? `Stack Trace: ${params.stackTrace}` : ''}

Code:
\`\`\`
${params.code}
\`\`\`

Provide debugging help as JSON:
{
  "errorExplanation": "What this error means",
  "rootCause": "What likely caused this error",
  "solution": "How to fix it",
  "codeExample": "Corrected code example",
  "preventionTips": ["tip1", "tip2", "tip3"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debugger helping students fix their code errors.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = completion.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(this.sanitizeJSON(jsonMatch[0]));
      }

      throw new Error('Could not parse debug solution');
    } catch (error) {
      console.error('Error in debug assistance:', error);
      return {
        errorExplanation: params.errorMessage,
        rootCause: 'Error analysis unavailable',
        solution: 'Please check the error message and consult documentation',
        codeExample: params.code,
        preventionTips: ['Review error messages carefully', 'Test your code incrementally'],
      };
    }
  }

  /**
   * Generate code explanation
   */
  async explainCodeDetailed(params: {
    code: string;
    programmingLanguage: string;
    detailLevel: 'beginner' | 'intermediate' | 'advanced';
    specificPart?: string;
  }): Promise<string> {
    const prompt = `Explain this ${params.programmingLanguage} code at ${params.detailLevel} level:

\`\`\`
${params.code}
\`\`\`

${params.specificPart ? `Focus on explaining: ${params.specificPart}` : 'Explain the entire code.'}

Provide:
1. Overall purpose
2. Line-by-line breakdown (if not too long)
3. Key concepts used
4. Common pitfalls to avoid
5. Practice exercise ideas

Format your response clearly with sections.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a clear and patient programming instructor explaining code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      return (
        completion.choices[0].message.content || 'Unable to generate explanation at this time.'
      );
    } catch (error) {
      console.error('Error generating code explanation:', error);
      return 'Sorry, I could not generate an explanation. Please try again later.';
    }
  }

  /**
   * Generate interactive quiz from code
   */
  async generateInteractiveQuiz(params: {
    topicOrCode: string;
    difficulty: string;
    numberOfQuestions?: number;
  }): Promise<
    Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>
  > {
    const numQuestions = params.numberOfQuestions || 5;
    const prompt = `Generate ${numQuestions} multiple-choice questions about:
${params.topicOrCode}

Difficulty: ${params.difficulty}

Return as JSON array:
[
  {
    "id": "q1",
    "question": "Question text?",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct"
  }
]`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are creating educational quiz questions for programming students. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = completion.choices[0].message.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(this.sanitizeJSON(jsonMatch[0]));
      }

      return [];
    } catch (error) {
      console.error('Error generating quiz:', error);
      return [];
    }
  }
}
