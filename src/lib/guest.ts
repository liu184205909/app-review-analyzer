// Guest user management and rate limiting
// Tracks anonymous users via IP address and browser fingerprint

import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a placeholder (shouldn't happen in production)
  return 'unknown';
}

/**
 * Generate a simple browser fingerprint from User-Agent and Accept-Language
 * This is not meant to be cryptographically secure, just a simple identifier
 */
export function getBrowserFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Create a simple hash-like string
  const combined = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Simple hash function (not cryptographic)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Check if a guest user can perform analysis
 * Limit: 1 analysis per IP address (resets after 24 hours)
 */
export async function canGuestAnalyze(ipAddress: string, fingerprint: string): Promise<{
  canAnalyze: boolean;
  reason?: string;
  remainingTime?: number; // milliseconds until reset
}> {
  try {
    // Dynamically import Prisma to avoid build-time issues
    const getPrisma = (await import('./prisma')).default;
    const prisma = getPrisma();

    // Check for recent guest analyses from this IP or fingerprint
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentAnalysis = await prisma.guestAnalysis.findFirst({
      where: {
        OR: [
          { ipAddress, createdAt: { gte: oneDayAgo } },
          { fingerprint, createdAt: { gte: oneDayAgo } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentAnalysis) {
      const timeSinceAnalysis = Date.now() - recentAnalysis.createdAt.getTime();
      const remainingTime = (24 * 60 * 60 * 1000) - timeSinceAnalysis;
      
      return {
        canAnalyze: false,
        reason: 'You have already used your free trial. Please sign up to get 3 analyses per month!',
        remainingTime,
      };
    }

    return { canAnalyze: true };
  } catch (error) {
    console.error('Error checking guest limit:', error);
    // On error, allow the analysis (fail open)
    return { canAnalyze: true };
  }
}

/**
 * Record a guest analysis
 */
export async function recordGuestAnalysis(
  ipAddress: string,
  fingerprint: string,
  taskId: string,
  metadata: {
    platform?: string;
    appUrl?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const getPrisma = (await import('./prisma')).default;
    const prisma = getPrisma();

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await prisma.guestAnalysis.create({
      data: {
        ipAddress,
        fingerprint,
        taskId,
        platform: metadata.platform as any,
        appUrl: metadata.appUrl,
        userAgent: metadata.userAgent,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error recording guest analysis:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Clean up expired guest analysis records (should be run periodically)
 */
export async function cleanupExpiredGuestAnalyses(): Promise<number> {
  try {
    const getPrisma = (await import('./prisma')).default;
    const prisma = getPrisma();

    const result = await prisma.guestAnalysis.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up guest analyses:', error);
    return 0;
  }
}

/**
 * Format remaining time in a human-readable format
 */
export function formatRemainingTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

