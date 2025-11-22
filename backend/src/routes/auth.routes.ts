import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(prisma);

  // Register new user
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const user = await authService.register(body);

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // Login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const result = await authService.login(body);

    return reply.send(result);
  });

  // Refresh access token
  app.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    const result = await authService.refreshAccessToken(body.refreshToken);

    return reply.send(result);
  });

  // Logout
  app.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    await authService.logout(body.refreshToken);

    return reply.status(204).send();
  });

  // Get current user
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            tier: true,
            monthlyMinutes: true,
            minutesUsed: true,
          },
        },
      },
    });

    return reply.send({ user });
  });

  // Change password
  app.post(
    '/change-password',
    { preHandler: authenticate },
    async (request, reply) => {
      const body = changePasswordSchema.parse(request.body);

      await authService.changePassword(
        request.user!.id,
        body.currentPassword,
        body.newPassword
      );

      return reply.status(204).send();
    }
  );
}
