import { prisma } from '@/lib/prisma';

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/**
 * Check if an IP address has exceeded the rate limit
 * @param ipAddress - The IP address to check
 * @returns Object with isRateLimited flag and remaining attempts
 */
export async function checkRateLimit(ipAddress: string): Promise<{
  isRateLimited: boolean;
  remainingAttempts: number;
  resetTime?: Date;
}> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  // Get all login attempts in the last 15 minutes for this IP
  const attempts = await prisma.loginAttempt.findMany({
    where: {
      ipAddress,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const attemptCount = attempts.length;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptCount);

  if (attemptCount >= MAX_ATTEMPTS) {
    // Calculate when the rate limit will reset (15 minutes from oldest attempt in window)
    const oldestAttempt = attempts[attempts.length - 1];
    const resetTime = new Date(
      oldestAttempt.createdAt.getTime() + WINDOW_MINUTES * 60 * 1000
    );

    return {
      isRateLimited: true,
      remainingAttempts: 0,
      resetTime,
    };
  }

  return {
    isRateLimited: false,
    remainingAttempts,
  };
}

/**
 * Record a login attempt (success or failure)
 * @param ipAddress - The IP address making the attempt
 * @param success - Whether the login was successful
 */
export async function recordLoginAttempt(
  ipAddress: string,
  success: boolean
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      ipAddress,
      success,
    },
  });

  // Clean up old login attempts (older than 15 minutes)
  // This prevents the table from growing indefinitely
  const cleanupThreshold = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: {
        lt: cleanupThreshold,
      },
    },
  });
}

/**
 * Calculate exponential backoff delay based on failed attempts
 * @param attemptNumber - The number of failed attempts
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attemptNumber: number): number {
  // Exponential backoff: 2^(attempt - 1) seconds, capped at 60 seconds
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Get the number of failed login attempts in the current window
 * @param ipAddress - The IP address to check
 * @returns Number of failed attempts
 */
export async function getFailedAttempts(ipAddress: string): Promise<number> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      success: false,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  return failedAttempts;
}

/**
 * Clear all login attempts for an IP address (e.g., after successful login)
 * @param ipAddress - The IP address to clear attempts for
 */
export async function clearLoginAttempts(ipAddress: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: {
      ipAddress,
    },
  });
}
