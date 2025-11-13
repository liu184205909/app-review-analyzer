// Prisma Client Singleton with build-time safety
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detect if we're in a build/static generation context
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

// Create Prisma client with error handling for build-time
let prismaInstance: PrismaClient;

if (isBuildTime) {
  // During build time, create a mock client that won't try to connect
  console.log('Build time detected - using mock Prisma client');
  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      },
    },
  });
} else {
  try {
    prismaInstance =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
          },
        },
      });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch (error) {
    console.warn('Prisma Client initialization warning:', error);
    // Fallback to a minimal client instance
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
        },
      },
    });
  }
}

export const prisma = prismaInstance;
export default prisma;

