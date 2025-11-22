import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { AuthService } from '../services/auth.service.js';
import { prisma } from '../db/client.js';
import { Role } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: Role;
    };
  }
}

const authService = new AuthService(prisma);

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const payload = await authService.verifyAccessToken(token);

    // Attach user to request
    request.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role as Role,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid access token');
  }
}

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new AuthorizationError(
        `Required role: ${roles.join(' or ')}`
      );
    }
  };
}
