/**
 * Performance Monitoring Utility
 * Tracks execution time and performance metrics
 */

import { logger } from './logger.js';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Track execution time of an async function
   */
  async track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        metadata,
      });

      logger.info(
        {
          operation,
          duration,
          ...metadata,
        },
        `Performance: ${operation} completed in ${duration}ms`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          operation,
          duration,
          error,
          ...metadata,
        },
        `Performance: ${operation} failed after ${duration}ms`
      );

      throw error;
    }
  }

  /**
   * Create a timer for manual tracking
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();

    return (metadata?: Record<string, any>) => {
      const duration = Date.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        metadata,
      });

      logger.info(
        {
          operation,
          duration,
          ...metadata,
        },
        `Performance: ${operation} took ${duration}ms`
      );
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory leak
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number | null {
    const metrics = this.getMetrics(operation);

    if (metrics.length === 0) {
      return null;
    }

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    // Group metrics by operation
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = [];
      }
      acc[metric.operation].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each operation
    Object.entries(grouped).forEach(([operation, durations]) => {
      summary[operation] = {
        count: durations.length,
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Helper function to measure execution time
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.track(operation, fn, metadata);
}

/**
 * Decorator for measuring method execution time
 */
export function Measure(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return measureTime(
        operationName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Express/Fastify middleware for tracking request performance
 */
export function performanceMiddleware() {
  return async (request: any, reply: any, next?: any) => {
    const startTime = Date.now();

    // For Fastify
    if (reply.raw) {
      reply.raw.on('finish', () => {
        const duration = Date.now() - startTime;

        logger.info(
          {
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            duration,
          },
          `Request: ${request.method} ${request.url} [${reply.statusCode}] ${duration}ms`
        );

        performanceMonitor['recordMetric']({
          operation: `${request.method} ${request.url}`,
          duration,
          timestamp: new Date(),
          metadata: {
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
          },
        });
      });
    }

    if (next) {
      return next();
    }
  };
}
