import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn('REDIS_URL not set, rate limiting will not work properly');
}

export const redis = REDIS_URL ? new Redis(REDIS_URL) : null;

// Avatar upload rate limit: 1 per day (24 hours)
const AVATAR_UPLOAD_LIMIT = 1;
const AVATAR_UPLOAD_WINDOW = 24 * 60 * 60; // 24 hours in seconds

/**
 * Check if user can upload avatar (rate limit: 1 per day)
 * @param userId - The user ID to check
 * @returns Object with canUpload flag and timeUntilReset
 */
export async function checkAvatarUploadRateLimit(userId: string): Promise<{
  canUpload: boolean;
  uploadsRemaining: number;
  timeUntilReset?: number; // seconds until they can upload again
}> {
  if (!redis) {
    // If Redis is not available, allow upload but warn
    console.warn('Redis not available, allowing avatar upload without rate limit');
    return { canUpload: true, uploadsRemaining: 1 };
  }

  const key = `avatar_upload:${userId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - AVATAR_UPLOAD_WINDOW;

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count uploads in the current window
    const uploadCount = await redis.zcard(key);
    
    if (uploadCount >= AVATAR_UPLOAD_LIMIT) {
      // Get the oldest upload to calculate reset time
      const oldestUpload = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = parseInt(oldestUpload[1] || '0');
      const timeUntilReset = Math.max(0, (oldestTimestamp + AVATAR_UPLOAD_WINDOW) - now);
      
      return {
        canUpload: false,
        uploadsRemaining: 0,
        timeUntilReset,
      };
    }

    return {
      canUpload: true,
      uploadsRemaining: AVATAR_UPLOAD_LIMIT - uploadCount,
    };
  } catch (error) {
    console.error('Redis rate limit check failed:', error);
    // Fail open - allow upload if Redis is down
    return { canUpload: true, uploadsRemaining: 1 };
  }
}

/**
 * Record an avatar upload for rate limiting
 * @param userId - The user ID who uploaded
 */
export async function recordAvatarUpload(userId: string): Promise<void> {
  if (!redis) {
    console.warn('Redis not available, cannot record avatar upload');
    return;
  }

  const key = `avatar_upload:${userId}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Add the upload timestamp
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration on the key (slightly longer than window to handle edge cases)
    await redis.expire(key, AVATAR_UPLOAD_WINDOW + 60);
  } catch (error) {
    console.error('Failed to record avatar upload in Redis:', error);
  }
}

/**
 * Clear avatar upload history (for admin use or testing)
 * @param userId - The user ID to clear
 */
export async function clearAvatarUploadHistory(userId: string): Promise<void> {
  if (!redis) return;

  const key = `avatar_upload:${userId}`;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Failed to clear avatar upload history:', error);
  }
}

/**
 * Format seconds into human-readable time
 * @param seconds - Number of seconds
 * @returns Formatted string like "23 hours" or "59 minutes"
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}