import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { memoRoutes } from './routes/memo.routes.js';
import metricsRoutes from './routes/metrics.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    trustProxy: true,
  });

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : ['https://yourdomain.com'],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: parseInt(env.RATE_LIMIT_MAX),
    timeWindow: parseInt(env.RATE_LIMIT_TIME_WINDOW),
  });

  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(memoRoutes, { prefix: '/api/memos' });
  await app.register(metricsRoutes, { prefix: '/api' });

  // Error handler (must be last)
  app.setErrorHandler(errorHandler);

  return app;
}
