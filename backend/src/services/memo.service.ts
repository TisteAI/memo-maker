/**
 * Memo Service
 * Implements TDD-driven memo management logic
 * Coverage requirement: 80%
 */

import { PrismaClient, Memo, MemoStatus, Transcript } from '@prisma/client';
import { z } from 'zod';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../utils/errors.js';

// Validation schemas
const createMemoSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  date: z.date().refine((date) => date <= new Date(), {
    message: 'Date cannot be in the future',
  }),
  participants: z.array(z.string()).optional(),
});

const updateMemoSchema = z.object({
  title: z.string().min(1).trim().optional(),
  participants: z.array(z.string()).optional(),
});

const listMemosSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  status: z.enum(['UPLOADING', 'TRANSCRIBING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
});

export type MemoWithTranscript = Memo & { transcript?: Transcript | null };

export interface CreateMemoInput {
  title: string;
  date: Date;
  participants?: string[];
}

export interface UpdateMemoInput {
  title?: string;
  participants?: string[];
}

export interface ListMemosOptions {
  limit?: number;
  offset?: number;
  status?: MemoStatus;
}

export interface MemoContent {
  summary: string;
  keyPoints?: string[];
  actionItems?: Array<{
    task: string;
    owner?: string;
    dueDate?: string;
  }>;
  decisions?: string[];
  [key: string]: unknown;
}

export class MemoService {
  constructor(private prisma: PrismaClient) {}

  async createMemo(userId: string, input: CreateMemoInput): Promise<Memo> {
    // Validate input
    const validation = createMemoSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid memo data',
        validation.error.flatten().fieldErrors
      );
    }

    const { title, date, participants = [] } = validation.data;

    // Create memo
    const memo = await this.prisma.memo.create({
      data: {
        userId,
        title,
        date,
        participants,
        status: 'UPLOADING',
      },
    });

    return memo;
  }

  async getMemo(memoId: string, userId: string): Promise<MemoWithTranscript> {
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId },
      include: {
        transcript: true,
      },
    });

    if (!memo) {
      throw new NotFoundError('Memo');
    }

    if (memo.userId !== userId) {
      throw new AuthorizationError('You do not have access to this memo');
    }

    return memo;
  }

  async listMemos(
    userId: string,
    options: ListMemosOptions = {}
  ): Promise<Memo[]> {
    // Validate options
    const validation = listMemosSchema.safeParse(options);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid list options',
        validation.error.flatten().fieldErrors
      );
    }

    const { limit = 50, offset = 0, status } = validation.data;

    const memos = await this.prisma.memo.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return memos;
  }

  async updateMemo(
    memoId: string,
    userId: string,
    input: UpdateMemoInput
  ): Promise<Memo> {
    // Validate input
    const validation = updateMemoSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid update data',
        validation.error.flatten().fieldErrors
      );
    }

    // Check memo exists and user owns it
    const existing = await this.prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!existing) {
      throw new NotFoundError('Memo');
    }

    if (existing.userId !== userId) {
      throw new AuthorizationError('You do not have access to this memo');
    }

    // Update memo
    const updated = await this.prisma.memo.update({
      where: { id: memoId },
      data: validation.data,
    });

    return updated;
  }

  async deleteMemo(memoId: string, userId: string): Promise<void> {
    // Check memo exists and user owns it
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      throw new NotFoundError('Memo');
    }

    if (memo.userId !== userId) {
      throw new AuthorizationError('You do not have access to this memo');
    }

    // Delete memo (cascade will handle transcript)
    await this.prisma.memo.delete({
      where: { id: memoId },
    });
  }

  async updateMemoStatus(
    memoId: string,
    status: MemoStatus,
    errorMessage?: string
  ): Promise<Memo> {
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      throw new NotFoundError('Memo');
    }

    const updated = await this.prisma.memo.update({
      where: { id: memoId },
      data: {
        status,
        ...(errorMessage && { errorMessage }),
      },
    });

    return updated;
  }

  async setAudioUrl(
    memoId: string,
    audioUrl: string,
    audioStorageKey: string
  ): Promise<Memo> {
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      throw new NotFoundError('Memo');
    }

    const updated = await this.prisma.memo.update({
      where: { id: memoId },
      data: {
        audioUrl,
        audioStorageKey,
      },
    });

    return updated;
  }

  async setMemoContent(
    memoId: string,
    content: MemoContent
  ): Promise<Memo> {
    const memo = await this.prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      throw new NotFoundError('Memo');
    }

    const updated = await this.prisma.memo.update({
      where: { id: memoId },
      data: {
        memoContent: content as any, // Prisma JSON type
      },
    });

    return updated;
  }

  async checkSubscriptionLimits(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return false;
    }

    // Check if user has exceeded monthly minutes
    if (subscription.minutesUsed >= subscription.monthlyMinutes) {
      return false;
    }

    return true;
  }

  async incrementUsage(userId: string, minutes: number): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        minutesUsed: {
          increment: minutes,
        },
      },
    });
  }
}
