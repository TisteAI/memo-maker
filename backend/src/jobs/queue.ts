/**
 * Job Queue Setup
 * Configures BullMQ queues for background processing
 */

import { Queue, QueueOptions } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Parse Redis URL
const redisConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port) || 6379,
};

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
};

// Transcription queue
export const transcriptionQueue = new Queue('transcription', defaultQueueOptions);

// Memo generation queue
export const memoGenerationQueue = new Queue('memo-generation', defaultQueueOptions);

// Queue event listeners for monitoring
transcriptionQueue.on('error', (error) => {
  logger.error({ error }, 'Transcription queue error');
});

memoGenerationQueue.on('error', (error) => {
  logger.error({ error }, 'Memo generation queue error');
});

logger.info('Job queues initialized');

// Export helper functions for adding jobs
export async function addTranscriptionJob(memoId: string) {
  const job = await transcriptionQueue.add(
    'transcribe-audio',
    { memoId },
    {
      jobId: `transcribe-${memoId}`,
      priority: 1, // Higher priority
    }
  );

  logger.info({ jobId: job.id, memoId }, 'Transcription job added');
  return job;
}

export async function addMemoGenerationJob(memoId: string) {
  const job = await memoGenerationQueue.add(
    'generate-memo',
    { memoId },
    {
      jobId: `generate-${memoId}`,
      priority: 2,
    }
  );

  logger.info({ jobId: job.id, memoId }, 'Memo generation job added');
  return job;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing job queues...');
  await transcriptionQueue.close();
  await memoGenerationQueue.close();
});
