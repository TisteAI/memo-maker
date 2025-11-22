import { PrismaClient, User, Memo } from '@prisma/client';
import bcrypt from 'bcrypt';

export class TestHelpers {
  constructor(private prisma: PrismaClient) {}

  async createUser(data?: Partial<User>): Promise<User> {
    const passwordHash = await bcrypt.hash(data?.passwordHash ?? 'Test123!', 10);

    return this.prisma.user.create({
      data: {
        email: data?.email ?? `test-${Date.now()}@example.com`,
        passwordHash,
        name: data?.name ?? 'Test User',
        role: data?.role ?? 'USER',
      },
    });
  }

  async createMemo(userId: string, data?: Partial<Memo>): Promise<Memo> {
    return this.prisma.memo.create({
      data: {
        userId,
        title: data?.title ?? 'Test Memo',
        date: data?.date ?? new Date(),
        status: data?.status ?? 'UPLOADING',
        duration: data?.duration,
        participants: data?.participants ?? [],
        audioUrl: data?.audioUrl,
        audioStorageKey: data?.audioStorageKey,
        memoContent: data?.memoContent,
      },
    });
  }

  async createRefreshToken(userId: string, expiresIn = 7): Promise<string> {
    const token = `refresh_${Date.now()}_${Math.random().toString(36)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async createSubscription(userId: string) {
    return this.prisma.subscription.create({
      data: {
        userId,
        tier: 'FREE',
        monthlyMinutes: 120,
        minutesUsed: 0,
      },
    });
  }

  async cleanDatabase() {
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      }
    }
  }
}
