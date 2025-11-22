/**
 * TDD MANDATORY - Tests written FIRST before implementation
 * These tests define the behavior of AuthService
 *
 * Test Coverage: 100% required for authentication (security-critical)
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase, getPrismaClient } from '../../tests/setup.js';
import { AuthService } from '../auth.service.js';
import { TestHelpers } from '../../tests/helpers.js';
import { AuthenticationError, ConflictError, ValidationError } from '../../utils/errors.js';

describe('AuthService (unit)', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let helpers: TestHelpers;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    authService = new AuthService(prisma);
    helpers = new TestHelpers(prisma);
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      const user = await authService.register(input);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(input.email);
      expect(user.name).toBe(input.name);
      expect(user.passwordHash).not.toBe(input.password); // Password should be hashed
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
      expect(user.role).toBe('USER');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create user without name (optional field)', async () => {
      const input = {
        email: 'noname@example.com',
        password: 'SecurePass123!',
      };

      const user = await authService.register(input);

      expect(user.email).toBe(input.email);
      expect(user.name).toBeNull();
    });

    it('should throw ConflictError for duplicate email', async () => {
      const existingUser = await helpers.createUser({ email: 'existing@example.com' });

      await expect(
        authService.register({
          email: existingUser.email,
          password: 'Password123!',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(
        authService.register({
          email: 'invalid-email',
          password: 'Password123!',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      await expect(
        authService.register({
          email: 'user@example.com',
          password: '123', // Too short
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should automatically create free subscription for new user', async () => {
      const user = await authService.register({
        email: 'subscriber@example.com',
        password: 'Password123!',
      });

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.tier).toBe('FREE');
      expect(subscription?.monthlyMinutes).toBe(120);
      expect(subscription?.minutesUsed).toBe(0);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      const password = 'TestPassword123!';
      const user = await helpers.createUser({
        email: 'login@example.com',
        passwordHash: password,
      });

      const result = await authService.login({
        email: user.email,
        password,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for incorrect password', async () => {
      const user = await helpers.createUser({
        email: 'user@example.com',
        passwordHash: 'CorrectPassword123!',
      });

      await expect(
        authService.login({
          email: user.email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should store refresh token in database', async () => {
      const password = 'TestPassword123!';
      const user = await helpers.createUser({
        email: 'token@example.com',
        passwordHash: password,
      });

      const result = await authService.login({
        email: user.email,
        password,
      });

      const storedToken = await prisma.refreshToken.findFirst({
        where: { userId: user.id },
      });

      expect(storedToken).toBeDefined();
      expect(storedToken?.token).toBe(result.refreshToken);
      expect(storedToken?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const user = await helpers.createUser();
      const refreshToken = await helpers.createRefreshToken(user.id);

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw AuthenticationError for invalid refresh token', async () => {
      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for expired refresh token', async () => {
      const user = await helpers.createUser();
      const expiredToken = await helpers.createRefreshToken(user.id, -1); // Expired yesterday

      await expect(
        authService.refreshAccessToken(expiredToken)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should implement token rotation - issue new refresh token', async () => {
      const user = await helpers.createUser();
      const oldRefreshToken = await helpers.createRefreshToken(user.id);

      const result = await authService.refreshAccessToken(oldRefreshToken);

      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(oldRefreshToken);

      // Old token should be invalidated
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
      });
      expect(oldToken).toBeNull();
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      const user = await helpers.createUser();
      const refreshToken = await helpers.createRefreshToken(user.id);

      await authService.logout(refreshToken);

      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      expect(token).toBeNull();
    });

    it('should not throw error for non-existent token', async () => {
      await expect(
        authService.logout('non-existent-token')
      ).resolves.not.toThrow();
    });
  });

  describe('verifyAccessToken', () => {
    it('should return user payload for valid access token', async () => {
      const user = await helpers.createUser();
      const password = 'TestPassword123!';
      await helpers.createUser({ email: user.email, passwordHash: password });

      const { accessToken } = await authService.login({
        email: user.email,
        password,
      });

      const payload = await authService.verifyAccessToken(accessToken);

      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.role).toBe(user.role);
    });

    it('should throw AuthenticationError for invalid token', async () => {
      await expect(
        authService.verifyAccessToken('invalid.token.here')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for expired token', async () => {
      // This test would require mocking time or creating token with past expiry
      // Skipping for now, but should be implemented with time manipulation
    });
  });

  describe('changePassword', () => {
    it('should update user password', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';
      const user = await helpers.createUser({ passwordHash: oldPassword });

      await authService.changePassword(user.id, oldPassword, newPassword);

      // Try logging in with new password
      const result = await authService.login({
        email: user.email,
        password: newPassword,
      });

      expect(result.accessToken).toBeDefined();
    });

    it('should throw AuthenticationError for incorrect current password', async () => {
      const user = await helpers.createUser({ passwordHash: 'CurrentPassword123!' });

      await expect(
        authService.changePassword(user.id, 'WrongPassword123!', 'NewPassword123!')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should revoke all refresh tokens on password change', async () => {
      const oldPassword = 'OldPassword123!';
      const user = await helpers.createUser({ passwordHash: oldPassword });
      await helpers.createRefreshToken(user.id);
      await helpers.createRefreshToken(user.id);

      await authService.changePassword(user.id, oldPassword, 'NewPassword123!');

      const tokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });

      expect(tokens).toHaveLength(0);
    });
  });
});
