import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class HighlightService {
  constructor(private prisma: PrismaService) {}

  async createHighlight(data: {
    tenantId: string;
    lessonId: string;
    userId: string;
    text: string;
    startPosition?: number;
    endPosition?: number;
    color?: string;
    notes?: string;
  }) {
    return this.prisma.highlight.create({
      data: {
        id: uuid(),
        tenantId: data.tenantId,
        lessonId: data.lessonId,
        userId: data.userId,
        text: data.text,
        startPosition: data.startPosition,
        endPosition: data.endPosition,
        color: data.color || 'yellow',
        notes: data.notes,
      },
    });
  }

  async getHighlight(highlightId: string, tenantId: string) {
    const highlight = await this.prisma.highlight.findFirst({
      where: {
        id: highlightId,
        tenantId,
      },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    return highlight;
  }

  async getLessonHighlights(lessonId: string, tenantId: string) {
    return this.prisma.highlight.findMany({
      where: {
        lessonId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserHighlights(tenantId: string, userId: string) {
    return this.prisma.highlight.findMany({
      where: {
        tenantId,
        userId,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateHighlight(
    highlightId: string,
    tenantId: string,
    data: {
      text?: string;
      color?: string;
      notes?: string;
    },
  ) {
    const highlight = await this.prisma.highlight.findFirst({
      where: {
        id: highlightId,
        tenantId,
      },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    return this.prisma.highlight.update({
      where: { id: highlightId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteHighlight(highlightId: string, tenantId: string) {
    const highlight = await this.prisma.highlight.findFirst({
      where: {
        id: highlightId,
        tenantId,
      },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    return this.prisma.highlight.delete({
      where: { id: highlightId },
    });
  }
}
