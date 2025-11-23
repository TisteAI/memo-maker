/**
 * Memo Generation Worker
 * Processes memo generation jobs using GPT-4
 */

import { Worker, Job } from 'bullmq';
import { prisma } from '../../db/client.js';
import { MemoService } from '../../services/memo.service.js';
import { MemoGenerationService } from '../../services/memo-generation.service.js';
import { logger } from '../../utils/logger.js';
import { measureTime } from '../../utils/performance.js';
import { env } from '../../config/env.js';

const redisConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port) || 6379,
};

interface MemoGenerationJobData {
  memoId: string;
}

export const memoGenerationWorker = new Worker<MemoGenerationJobData>(
  'memo-generation',
  async (job: Job<MemoGenerationJobData>) => {
    const { memoId } = job.data;

    logger.info({ jobId: job.id, memoId }, 'Processing memo generation job');

    const memoService = new MemoService(prisma);
    const memoGenerationService = new MemoGenerationService();

    try {
      // Update status to GENERATING
      await memoService.updateMemoStatus(memoId, 'GENERATING');

      // Get memo with transcript
      const memo = await prisma.memo.findUnique({
        where: { id: memoId },
        include: {
          transcript: true,
        },
      });

      if (!memo) {
        throw new Error('Memo not found');
      }

      if (!memo.transcript) {
        throw new Error('No transcript available');
      }

      // Validate transcript
      memoGenerationService.validateTranscript(memo.transcript.text);

      // Generate memo content with performance tracking
      logger.info({ memoId, transcriptLength: memo.transcript.text.length }, 'Generating memo');
      const content = await measureTime(
        'memo-generation',
        () => memoGenerationService.generateMemo(
          memo.transcript.text,
          {
            title: memo.title,
            participants: memo.participants as string[],
            date: memo.date,
          }
        ),
        {
          memoId,
          transcriptLength: memo.transcript.text.length,
        }
      );

      // Save memo content
      await memoService.setMemoContent(memoId, content);

      // Update status to COMPLETED
      await memoService.updateMemoStatus(memoId, 'COMPLETED');

      logger.info(
        {
          memoId,
          actionItems: content.actionItems.length,
          keyPoints: content.keyPoints.length,
        },
        'Memo generation completed'
      );

      return { success: true, content };
    } catch (error: any) {
      logger.error({ error, memoId }, 'Memo generation job failed');

      // Update memo status to FAILED
      await memoService.updateMemoStatus(
        memoId,
        'FAILED',
        `Memo generation failed: ${error.message}`
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process 3 memo generations simultaneously
  }
);

memoGenerationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Memo generation job completed');
});

memoGenerationWorker.on('failed', (job, error) => {
  logger.error(
    { jobId: job?.id, error },
    'Memo generation job failed'
  );
});

logger.info('Memo generation worker started');
