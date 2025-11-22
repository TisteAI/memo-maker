/**
 * Authentication Service
 * Implements TDD-driven authentication logic
 * Coverage requirement: 100% (security-critical)
 */

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../utils/errors.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 10;

// Validation schemas
const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    // Validate input
    const validation = registerSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid registration data',
        validation.error.flatten().fieldErrors
      );
    }

    const { email, password, name } = validation.data;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user with subscription
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        subscription: {
          create: {
            tier: 'FREE',
            monthlyMinutes: 120,
            minutesUsed: 0,
          },
        },
      },
    });

    return user;
  }

  async login(input: { email: string; password: string }): Promise<AuthTokens> {
    // Validate input
    const validation = loginSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid login data',
        validation.error.flatten().fieldErrors
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new AuthenticationError('Refresh token expired');
    }

    const { user } = storedToken;

    // Implement token rotation: delete old token
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Generate new tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async verifyAccessToken(accessToken: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(accessToken, env.JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Validate new password
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid password',
        validation.error.flatten().fieldErrors
      );
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password and revoke all refresh tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);
  }

  private generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const expiresAt = new Date();
    const days = parseInt(env.JWT_REFRESH_EXPIRY.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
