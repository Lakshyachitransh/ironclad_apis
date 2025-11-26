import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  // Quiz CRUD Operations
  async createQuiz(lessonId: string, data: {
    title: string;
    description?: string;
    instructions?: string;
    passingScore?: number;
    attemptsAllowed?: number;
    timeLimit?: number;
    shuffleQuestions?: boolean;
  }) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.quiz.create({
      data: {
        lessonId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        passingScore: data.passingScore || 70,
        attemptsAllowed: data.attemptsAllowed || 1,
        timeLimit: data.timeLimit,
        shuffleQuestions: data.shuffleQuestions || false,
        status: 'draft',
      },
    });
  }

  async getQuizzes(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async updateQuiz(quizId: string, data: any) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quiz.update({
      where: { id: quizId },
      data,
      include: {
        questions: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async publishQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Cannot publish quiz without questions');
    }

    return this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: 'published' },
    });
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quiz.delete({ where: { id: quizId } });
  }

  // Question Management
  async addQuestion(quizId: string, data: {
    type: string;
    questionText: string;
    explanation?: string;
    points?: number;
  }) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionCount = await this.prisma.quizQuestion.count({
      where: { quizId },
    });

    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        type: data.type,
        questionText: data.questionText,
        explanation: data.explanation,
        points: data.points || 1,
        displayOrder: questionCount,
      },
    });
  }

  async updateQuestion(questionId: string, data: any) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data,
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  // Option Management
  async addOption(questionId: string, data: {
    optionText: string;
    isCorrect: boolean;
  }) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const optionCount = await this.prisma.quizOption.count({
      where: { questionId },
    });

    return this.prisma.quizOption.create({
      data: {
        questionId,
        optionText: data.optionText,
        isCorrect: data.isCorrect,
        displayOrder: optionCount,
      },
    });
  }

  async updateOption(optionId: string, data: any) {
    const option = await this.prisma.quizOption.findUnique({
      where: { id: optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    return this.prisma.quizOption.update({
      where: { id: optionId },
      data,
    });
  }

  async deleteOption(optionId: string) {
    const option = await this.prisma.quizOption.findUnique({
      where: { id: optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    return this.prisma.quizOption.delete({ where: { id: optionId } });
  }

  // Quiz Attempts
  async startQuizAttempt(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { attempts: { where: { userId } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const completedAttempts = quiz.attempts.filter((a) => a.status === 'submitted');
    if (
      quiz.attemptsAllowed !== -1 &&
      completedAttempts.length >= quiz.attemptsAllowed
    ) {
      throw new BadRequestException(
        `Maximum attempts (${quiz.attemptsAllowed}) reached`
      );
    }

    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        status: 'in_progress',
      },
      include: {
        quiz: {
          include: { questions: { include: { options: true } } },
        },
      },
    });
  }

  async getAttempt(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        answers: true,
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  async submitAnswer(attemptId: string, questionId: string, selectedOption: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('Attempt is not in progress');
    }

    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    let isCorrect = false;
    if (question.type === 'multiple_choice') {
      const option = question.options.find((o) => o.id === selectedOption);
      isCorrect = option?.isCorrect || false;
    } else if (question.type === 'true_false') {
      isCorrect = selectedOption.toLowerCase() === 'true'
        ? question.options[0]?.isCorrect
        : !question.options[0]?.isCorrect;
    }

    return this.prisma.quizAnswer.create({
      data: {
        attemptId,
        questionId,
        selectedOption,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      },
    });
  }

  async submitQuiz(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true,
        answers: { include: { question: true } },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('Attempt is not in progress');
    }

    // Calculate score
    const totalPoints = await this.prisma.quizQuestion.aggregate({
      where: { quizId: attempt.quizId },
      _sum: { points: true },
    });

    const earnedPoints = attempt.answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
    const total = totalPoints._sum.points || 1;
    const percentage = (earnedPoints / total) * 100;

    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'submitted',
        score: earnedPoints,
        percentage,
        completedAt: new Date(),
      },
      include: { answers: true },
    });
  }

  async getUserAttempts(quizId: string, userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      include: { answers: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuizResults(quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, status: 'submitted' },
      include: { answers: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
