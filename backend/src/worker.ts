/**
 * Worker Process Entry Point
 * Starts all background job workers
 *
 * Run this separately from the main API server:
 * npm run worker
 */

import { logger } from './utils/logger.js';
import { prisma } from './db/client.js';
import './jobs/workers/transcription.worker.js';
import './jobs/workers/memo-generation.worker.js';

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    logger.info('🚀 Background workers started');
    logger.info('Workers: transcription, memo-generation');

    // Keep process alive
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down workers...');
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down workers...');
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

start();
