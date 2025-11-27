import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

interface GeneratedQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

@Injectable()
export class QuizGeneratorService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuizzesFromVideoContent(
    videoContent: string,
    lessonId: string,
    courseId: string,
  ) {
    // Call OpenAI to generate 6 quizzes based on video content
    const prompt = this.createQuizPrompt(videoContent);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content creator. Generate exactly 6 multiple-choice quizzes based on the provided video content. 
          
Return ONLY valid JSON in this exact format:
{
  "quizzes": [
    {
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "explanation": "explanation of why this is correct"
    }
  ]
}

Requirements:
- Generate EXACTLY 6 quizzes
- Each quiz must have EXACTLY 4 options
- correctAnswer must be 0, 1, 2, or 3 (index of correct option)
- Each option should be 1-100 characters
- Explanations should be 2-200 characters
- Questions should test understanding of key concepts from the video`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse the response
    const content = response.choices[0].message.content;
    let quizData: { quizzes: GeneratedQuiz[] };

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      quizData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error.message}`);
    }

    // Validate the structure
    if (
      !quizData.quizzes ||
      !Array.isArray(quizData.quizzes) ||
      quizData.quizzes.length !== 6
    ) {
      throw new Error('OpenAI did not generate exactly 6 quizzes');
    }

    // Save quizzes to database
    const savedQuiz = await this.saveQuizzesToDatabase(
      quizData.quizzes,
      lessonId,
      courseId,
      videoContent,
    );

    return {
      quizzes: savedQuiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        explanation: q.explanation,
        order: q.displayOrder,
        options: q.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          order: o.displayOrder,
        })),
      })),
      generatedAt: new Date(),
      lessonId,
      videoContentSummary: videoContent.substring(0, 200),
    };
  }

  private createQuizPrompt(videoContent: string): string {
    return `Based on the following video content, generate 6 multiple-choice quizzes:

VIDEO CONTENT:
${videoContent}

Generate quizzes that:
1. Test key concepts and learning objectives
2. Have one correct answer and three plausible distractors
3. Vary in difficulty (mix easy, medium, and hard)
4. Cover different aspects of the content
5. Are clear and unambiguous`;
  }

  private async saveQuizzesToDatabase(
    quizzes: GeneratedQuiz[],
    lessonId: string,
    courseId: string,
    videoContent: string,
  ) {
    // Create a quiz container for this lesson
    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId,
        title: `Quiz from Lesson`,
        description: `Quiz automatically generated from video content`,
        passingScore: 70,
        status: 'published',
        questions: {
          create: quizzes.map((q, index) => ({
            questionText: q.question,
            explanation: q.explanation,
            displayOrder: index + 1,
            type: 'multiple_choice',
            points: 1,
            options: {
              create: q.options.map((option, optIndex) => ({
                optionText: option,
                isCorrect: optIndex === q.correctAnswer,
                displayOrder: optIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return quiz;
  }

  async getQuizzesForLesson(lessonId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return quizzes;
  }

  async submitQuizAttempt(
    quizId: string,
    userId: string,
    answers: { questionId: string; selectedOptionId: string }[],
  ) {
    // Create quiz attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: {
          create: answers.map((answer) => ({
            questionId: answer.questionId,
            selectedOption: answer.selectedOptionId,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Calculate score
    let correctCount = 0;
    for (const answer of answers) {
      const option = await this.prisma.quizOption.findUnique({
        where: { id: answer.selectedOptionId },
      });
      if (option?.isCorrect) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / answers.length) * 100);

    // Update attempt with score
    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        percentage: (correctCount / answers.length) * 100,
        status: 'graded',
        completedAt: new Date(),
      },
    });

    return {
      attemptId: updatedAttempt.id,
      score,
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      passed: score >= 70,
    };
  }
}
