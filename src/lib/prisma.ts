// Prisma Client with true lazy initialization
// This module exports a getter function instead of a pre-initialized instance

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 * This function ensures Prisma is only initialized when actually used
 */
function getPrismaClient(): PrismaClient {
  // Return existing instance if available
  if (prismaInstance) {
    return prismaInstance;
  }

  // Return global instance if available
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  // Detect build-time environment
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL);

  if (isBuildTime) {
    // Create a mock client for build time
    console.log('[Prisma] Build time detected - creating placeholder client');
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
        },
      },
    });
  } else {
    // Create real client for runtime
    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        console.warn('[Prisma] DATABASE_URL not set, using placeholder');
      }

      prismaInstance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
          },
        },
      });

      // Store in global for development
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prismaInstance;
      }
    } catch (error) {
      console.error('[Prisma] Failed to initialize client:', error);
      // Create fallback instance
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
          },
        },
      });
    }
  }

  return prismaInstance;
}

// Export the getter function as default
// IMPORTANT: This is a function, not an instance!
export default getPrismaClient;

// Also export a named getter for consistency
export const getPrisma = getPrismaClient;

// DO NOT export a pre-initialized instance
// The old pattern was: export const prisma = prismaInstance;
// This caused build-time initialization issues
