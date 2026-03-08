import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Production-ready distributed rate limiter using Upstash Redis.
 * Tracks per-user request timestamps and enforces a maximum number
 * of requests within a time window across all serverless instances.
 */

// Initialize Redis client only if environment variables are set
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedisConfig ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

// Create a new ratelimiter that allows 5 requests per 1 hour
const ratelimit = redis ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    // Optional: add a prefix to the redis keys
    prefix: '@upstash/ratelimit/blueprinx',
}) : null;

export async function checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}> {
    try {
        // If Redis credentials are not configured, allow the request quietly
        // (prevents breaking the app if someone clones the repo without setting up Redis)
        if (!ratelimit) {
            return { allowed: true, remaining: 5, retryAfterSeconds: 0 };
        }

        const { success, remaining, reset } = await ratelimit.limit(userId);

        // Reset is a unix timestamp in milliseconds
        const retryAfterSeconds = success ? 0 : Math.ceil((reset - Date.now()) / 1000);

        return {
            allowed: success,
            remaining,
            retryAfterSeconds: Math.max(0, retryAfterSeconds),
        };
    } catch (error) {
        // Fail open: if Redis is down, allow the request but log the error
        console.error('Rate limiter Redis error:', error);
        return { allowed: true, remaining: 1, retryAfterSeconds: 0 };
    }
}
