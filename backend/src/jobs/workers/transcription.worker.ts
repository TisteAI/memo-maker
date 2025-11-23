/**
 * Transcription Worker
 * Processes audio transcription jobs using OpenAI Whisper
 */

import { Worker, Job } from 'bullmq';
import { prisma } from '../../db/client.js';
import { MemoService } from '../../services/memo.service.js';
import { StorageService } from '../../services/storage.service.js';
import { TranscriptionService } from '../../services/transcription.service.js';
import { addMemoGenerationJob } from '../queue.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const redisConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port) || 6379,
};

interface TranscriptionJobData {
  memoId: string;
}

export const transcriptionWorker = new Worker<TranscriptionJobData>(
  'transcription',
  async (job: Job<TranscriptionJobData>) => {
    const { memoId } = job.data;

    logger.info({ jobId: job.id, memoId }, 'Processing transcription job');

    const memoService = new MemoService(prisma);
    const storageService = new StorageService();
    const transcriptionService = new TranscriptionService();

    try {
      // Update status to TRANSCRIBING
      await memoService.updateMemoStatus(memoId, 'TRANSCRIBING');

      // Get memo
      const memo = await prisma.memo.findUnique({
        where: { id: memoId },
        include: { user: true },
      });

      if (!memo) {
        throw new Error('Memo not found');
      }

      if (!memo.audioStorageKey) {
        throw new Error('No audio file available');
      }

      // Download audio from S3
      logger.info({ memoId, key: memo.audioStorageKey }, 'Downloading audio');
      const audioBuffer = await storageService.downloadAudio(memo.audioStorageKey);

      // Transcribe audio
      logger.info({ memoId, size: audioBuffer.length }, 'Transcribing audio');
      const result = await transcriptionService.transcribeAudio(audioBuffer);

      // Save transcript to database
      await prisma.transcript.create({
        data: {
          memoId,
          text: result.text,
          segments: result.segments as any,
          language: result.language,
        },
      });

      // Update memo duration
      await prisma.memo.update({
        where: { id: memoId },
        data: {
          duration: result.duration * 60, // Convert minutes to seconds
        },
      });

      // Update subscription usage
      await memoService.incrementUsage(memo.userId, result.duration);

      logger.info(
        {
          memoId,
          duration: result.duration,
          textLength: result.text.length,
        },
        'Transcription completed'
      );

      // Trigger memo generation job
      await addMemoGenerationJob(memoId);

      return { success: true, duration: result.duration };
    } catch (error: any) {
      logger.error({ error, memoId }, 'Transcription job failed');

      // Update memo status to FAILED
      await memoService.updateMemoStatus(
        memoId,
        'FAILED',
        `Transcription failed: ${error.message}`
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 transcriptions simultaneously
  }
);

transcriptionWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Transcription job completed');
});

transcriptionWorker.on('failed', (job, error) => {
  logger.error(
    { jobId: job?.id, error },
    'Transcription job failed'
  );
});

logger.info('Transcription worker started');
