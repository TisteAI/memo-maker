import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './db/client.js';

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Build and start server
    const app = await buildApp();

    await app.listen({
      port: parseInt(env.PORT),
      host: '0.0.0.0',
    });

    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
