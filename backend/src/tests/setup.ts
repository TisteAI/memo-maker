import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

let postgresContainer: StartedPostgreSqlContainer;
let prismaClient: PrismaClient;

export async function setupTestDatabase() {
  // Start PostgreSQL container
  postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
    .withExposedPorts(5432)
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();

  // Set environment variable for Prisma
  process.env.DATABASE_URL = databaseUrl;

  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // Create Prisma client
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prismaClient.$connect();

  return prismaClient;
}

export async function teardownTestDatabase() {
  await prismaClient?.$disconnect();
  await postgresContainer?.stop();
}

export function getPrismaClient() {
  return prismaClient;
}

// Setup before all tests
export async function globalSetup() {
  await setupTestDatabase();
}

// Teardown after all tests
export async function globalTeardown() {
  await teardownTestDatabase();
}

// Clean database between tests
export async function cleanDatabase() {
  const client = getPrismaClient();
  const tables = await client.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await client.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      );
    }
  }
}
