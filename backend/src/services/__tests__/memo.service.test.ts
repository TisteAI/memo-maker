/**
 * TDD MANDATORY - Tests written FIRST before implementation
 * These tests define the behavior of MemoService
 *
 * Test Coverage: 80% required for business logic
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase, getPrismaClient } from '../../tests/setup.js';
import { MemoService } from '../memo.service.js';
import { TestHelpers } from '../../tests/helpers.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';

describe('MemoService (unit)', () => {
  let prisma: PrismaClient;
  let memoService: MemoService;
  let helpers: TestHelpers;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    memoService = new MemoService(prisma);
    helpers = new TestHelpers(prisma);
  });

  describe('createMemo', () => {
    it('should create memo with valid data', async () => {
      const user = await helpers.createUser();
      const input = {
        title: 'Team Meeting',
        date: new Date('2024-01-15T10:00:00Z'),
      };

      const memo = await memoService.createMemo(user.id, input);

      expect(memo.id).toBeDefined();
      expect(memo.title).toBe(input.title);
      expect(memo.date).toEqual(input.date);
      expect(memo.userId).toBe(user.id);
      expect(memo.status).toBe('UPLOADING');
      expect(memo.participants).toEqual([]);
      expect(memo.audioUrl).toBeNull();
      expect(memo.memoContent).toBeNull();
    });

    it('should create memo with participants', async () => {
      const user = await helpers.createUser();
      const participants = ['Alice', 'Bob', 'Charlie'];
      const input = {
        title: 'Team Meeting',
        date: new Date(),
        participants,
      };

      const memo = await memoService.createMemo(user.id, input);

      expect(memo.participants).toEqual(participants);
    });

    it('should throw ValidationError for empty title', async () => {
      const user = await helpers.createUser();

      await expect(
        memoService.createMemo(user.id, {
          title: '',
          date: new Date(),
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        memoService.createMemo(user.id, {
          title: '   ',
          date: new Date(),
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid date', async () => {
      const user = await helpers.createUser();

      await expect(
        memoService.createMemo(user.id, {
          title: 'Meeting',
          date: new Date('invalid'),
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for future date', async () => {
      const user = await helpers.createUser();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await expect(
        memoService.createMemo(user.id, {
          title: 'Meeting',
          date: futureDate,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getMemo', () => {
    it('should return memo by id for owner', async () => {
      const user = await helpers.createUser();
      const created = await helpers.createMemo(user.id, { title: 'Test Memo' });

      const memo = await memoService.getMemo(created.id, user.id);

      expect(memo).toBeDefined();
      expect(memo.id).toBe(created.id);
      expect(memo.title).toBe('Test Memo');
    });

    it('should include transcript if available', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);
      await prisma.transcript.create({
        data: {
          memoId: memo.id,
          text: 'This is the transcript',
          segments: [],
          language: 'en',
        },
      });

      const result = await memoService.getMemo(memo.id, user.id);

      expect(result.transcript).toBeDefined();
      expect(result.transcript?.text).toBe('This is the transcript');
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      const user = await helpers.createUser();

      await expect(
        memoService.getMemo('non-existent-id', user.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when accessing other users memo', async () => {
      const user1 = await helpers.createUser({ email: 'user1@example.com' });
      const user2 = await helpers.createUser({ email: 'user2@example.com' });
      const memo = await helpers.createMemo(user1.id);

      await expect(
        memoService.getMemo(memo.id, user2.id)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('listMemos', () => {
    it('should return users memos in descending date order', async () => {
      const user = await helpers.createUser();
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-15');
      const date3 = new Date('2024-01-20');

      await helpers.createMemo(user.id, { title: 'Memo 1', date: date1 });
      await helpers.createMemo(user.id, { title: 'Memo 2', date: date2 });
      await helpers.createMemo(user.id, { title: 'Memo 3', date: date3 });

      const memos = await memoService.listMemos(user.id);

      expect(memos).toHaveLength(3);
      expect(memos[0].title).toBe('Memo 3'); // Most recent first
      expect(memos[1].title).toBe('Memo 2');
      expect(memos[2].title).toBe('Memo 1');
    });

    it('should support pagination', async () => {
      const user = await helpers.createUser();

      // Create 15 memos
      for (let i = 0; i < 15; i++) {
        await helpers.createMemo(user.id, { title: `Memo ${i}` });
      }

      const page1 = await memoService.listMemos(user.id, { limit: 10, offset: 0 });
      const page2 = await memoService.listMemos(user.id, { limit: 10, offset: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
    });

    it('should filter by status', async () => {
      const user = await helpers.createUser();
      await helpers.createMemo(user.id, { title: 'Completed', status: 'COMPLETED' });
      await helpers.createMemo(user.id, { title: 'Failed', status: 'FAILED' });
      await helpers.createMemo(user.id, { title: 'Uploading', status: 'UPLOADING' });

      const completed = await memoService.listMemos(user.id, { status: 'COMPLETED' });
      const failed = await memoService.listMemos(user.id, { status: 'FAILED' });

      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('Completed');
      expect(failed).toHaveLength(1);
      expect(failed[0].title).toBe('Failed');
    });

    it('should only return memos for specified user', async () => {
      const user1 = await helpers.createUser({ email: 'user1@example.com' });
      const user2 = await helpers.createUser({ email: 'user2@example.com' });

      await helpers.createMemo(user1.id, { title: 'User 1 Memo' });
      await helpers.createMemo(user2.id, { title: 'User 2 Memo' });

      const user1Memos = await memoService.listMemos(user1.id);

      expect(user1Memos).toHaveLength(1);
      expect(user1Memos[0].title).toBe('User 1 Memo');
    });

    it('should return empty array when user has no memos', async () => {
      const user = await helpers.createUser();

      const memos = await memoService.listMemos(user.id);

      expect(memos).toEqual([]);
    });
  });

  describe('updateMemo', () => {
    it('should update memo title', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id, { title: 'Old Title' });

      const updated = await memoService.updateMemo(memo.id, user.id, {
        title: 'New Title',
      });

      expect(updated.title).toBe('New Title');
    });

    it('should update memo participants', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);

      const updated = await memoService.updateMemo(memo.id, user.id, {
        participants: ['Alice', 'Bob'],
      });

      expect(updated.participants).toEqual(['Alice', 'Bob']);
    });

    it('should not update if no changes provided', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id, { title: 'Original' });

      const updated = await memoService.updateMemo(memo.id, user.id, {});

      expect(updated.title).toBe('Original');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      const user = await helpers.createUser();

      await expect(
        memoService.updateMemo('non-existent', user.id, { title: 'New' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when updating other users memo', async () => {
      const user1 = await helpers.createUser({ email: 'user1@example.com' });
      const user2 = await helpers.createUser({ email: 'user2@example.com' });
      const memo = await helpers.createMemo(user1.id);

      await expect(
        memoService.updateMemo(memo.id, user2.id, { title: 'Hacked' })
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteMemo', () => {
    it('should delete memo and associated data', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);

      // Add transcript
      await prisma.transcript.create({
        data: {
          memoId: memo.id,
          text: 'Test transcript',
          segments: [],
        },
      });

      await memoService.deleteMemo(memo.id, user.id);

      const deleted = await prisma.memo.findUnique({ where: { id: memo.id } });
      const transcript = await prisma.transcript.findUnique({ where: { memoId: memo.id } });

      expect(deleted).toBeNull();
      expect(transcript).toBeNull(); // Cascade delete
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      const user = await helpers.createUser();

      await expect(
        memoService.deleteMemo('non-existent', user.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when deleting other users memo', async () => {
      const user1 = await helpers.createUser({ email: 'user1@example.com' });
      const user2 = await helpers.createUser({ email: 'user2@example.com' });
      const memo = await helpers.createMemo(user1.id);

      await expect(
        memoService.deleteMemo(memo.id, user2.id)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('updateMemoStatus', () => {
    it('should update memo status to TRANSCRIBING', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id, { status: 'UPLOADING' });

      const updated = await memoService.updateMemoStatus(memo.id, 'TRANSCRIBING');

      expect(updated.status).toBe('TRANSCRIBING');
    });

    it('should update status to FAILED with error message', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);

      const updated = await memoService.updateMemoStatus(
        memo.id,
        'FAILED',
        'Transcription failed: API error'
      );

      expect(updated.status).toBe('FAILED');
      expect(updated.errorMessage).toBe('Transcription failed: API error');
    });

    it('should update status to COMPLETED', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id, { status: 'GENERATING' });

      const updated = await memoService.updateMemoStatus(memo.id, 'COMPLETED');

      expect(updated.status).toBe('COMPLETED');
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      await expect(
        memoService.updateMemoStatus('non-existent', 'COMPLETED')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('setAudioUrl', () => {
    it('should set audio URL and storage key', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);

      const updated = await memoService.setAudioUrl(
        memo.id,
        'https://s3.amazonaws.com/bucket/audio.mp3',
        'memos/123/audio.mp3'
      );

      expect(updated.audioUrl).toBe('https://s3.amazonaws.com/bucket/audio.mp3');
      expect(updated.audioStorageKey).toBe('memos/123/audio.mp3');
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      await expect(
        memoService.setAudioUrl('non-existent', 'url', 'key')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('setMemoContent', () => {
    it('should set generated memo content', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id);

      const content = {
        summary: 'Meeting summary',
        keyPoints: ['Point 1', 'Point 2'],
        actionItems: [
          { task: 'Follow up with client', owner: 'Alice', dueDate: '2024-02-01' },
        ],
        decisions: ['Decision 1'],
      };

      const updated = await memoService.setMemoContent(memo.id, content);

      expect(updated.memoContent).toEqual(content);
    });

    it('should throw NotFoundError for non-existent memo', async () => {
      await expect(
        memoService.setMemoContent('non-existent', { summary: 'test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDuration', () => {
    it('should calculate duration for completed memo', async () => {
      const user = await helpers.createUser();
      const memo = await helpers.createMemo(user.id, {
        status: 'COMPLETED',
        duration: 3600, // 1 hour in seconds
      });

      const result = await memoService.getMemo(memo.id, user.id);

      expect(result.duration).toBe(3600);
    });
  });

  describe('checkSubscriptionLimits', () => {
    it('should allow memo creation when under limit', async () => {
      const user = await helpers.createUser();
      await helpers.createSubscription(user.id);

      const canCreate = await memoService.checkSubscriptionLimits(user.id);

      expect(canCreate).toBe(true);
    });

    it('should prevent memo creation when over monthly limit', async () => {
      const user = await helpers.createUser();
      await prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'FREE',
          monthlyMinutes: 120,
          minutesUsed: 125, // Over limit
        },
      });

      const canCreate = await memoService.checkSubscriptionLimits(user.id);

      expect(canCreate).toBe(false);
    });
  });
});
