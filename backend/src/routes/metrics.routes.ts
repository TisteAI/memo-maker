/**
 * Performance Metrics Routes
 * Endpoints for viewing application performance metrics
 */

import { FastifyInstance } from 'fastify';
import { performanceMonitor } from '../utils/performance.js';

export default async function metricsRoutes(app: FastifyInstance) {
  // Get performance summary
  app.get('/metrics/performance', async (request, reply) => {
    const summary = performanceMonitor.getSummary();

    return reply.send({
      summary,
      timestamp: new Date().toISOString(),
    });
  });

  // Get metrics for specific operation
  app.get<{
    Params: { operation: string };
  }>('/metrics/performance/:operation', async (request, reply) => {
    const { operation } = request.params;
    const metrics = performanceMonitor.getMetrics(operation);
    const average = performanceMonitor.getAverageDuration(operation);

    return reply.send({
      operation,
      metrics,
      average,
      count: metrics.length,
    });
  });

  // Health check with performance info
  app.get('/metrics/health', async () => {
    const summary = performanceMonitor.getSummary();
    const operations = Object.keys(summary);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      performance: {
        trackedOperations: operations.length,
        totalMetrics: operations.reduce((sum, op) => sum + summary[op].count, 0),
        operations: operations.map(op => ({
          name: op,
          count: summary[op].count,
          avgDuration: Math.round(summary[op].avg),
          minDuration: summary[op].min,
          maxDuration: summary[op].max,
        })),
      },
    };
  });
}
