// Prisma Client Singleton
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with error handling for build-time
let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      // Add connection timeout to prevent hanging during build
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.warn('Prisma Client initialization warning (may be build-time):', error);
  // Create a minimal client instance for build time
  prismaInstance = new PrismaClient();
}

export const prisma = prismaInstance;
export default prisma;

