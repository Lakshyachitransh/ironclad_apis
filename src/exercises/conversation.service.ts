import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async createConversation(data: {
    tenantId: string;
    userId: string;
    courseId?: string;
    lessonId?: string;
    topic?: string;
  }) {
    return this.prisma.conversation.create({
      data: {
        id: uuid(),
        tenantId: data.tenantId,
        userId: data.userId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        topic: data.topic,
        title: `${data.topic || 'Discussion'} - ${new Date().toLocaleDateString()}`,
      },
      include: {
        messages: true,
      },
    });
  }

  async getConversation(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async addMessage(
    conversationId: string,
    data: {
      tenantId: string;
      role: 'user' | 'assistant';
      content: string;
      metadata?: Record<string, any>;
    },
  ) {
    // Verify conversation exists and belongs to tenant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: data.tenantId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        id: uuid(),
        conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getConversationHistory(
    conversationId: string,
    tenantId: string,
    limit = 50,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversation: {
          id: conversationId,
          tenantId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return messages;
  }

  async listConversations(
    tenantId: string,
    userId?: string,
    courseId?: string,
  ) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(courseId && { courseId }),
      },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });

    return conversations;
  }

  async deleteConversation(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Delete all messages first (cascade)
    await this.prisma.message.deleteMany({
      where: {
        conversationId,
      },
    });

    // Then delete conversation
    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
