import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error({
    err: error,
    req: {
      id: request.id,
      method: request.method,
      url: request.url,
      // @ts-expect-error - user may not exist
      userId: request.user?.id,
    },
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten().fieldErrors,
      },
    });
  }

  // Custom application errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  // Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode ?? 500).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }

  // Generic errors - don't leak details in production
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message;

  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
}
