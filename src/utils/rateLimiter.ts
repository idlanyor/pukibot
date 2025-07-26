import { Logger } from './logger';

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Maximum requests per window
    blockDurationMs: number; // How long to block after limit exceeded
}

export interface UserLimitInfo {
    count: number;
    windowStart: number;
    blockedUntil?: number;
    lastMessage?: string;
    lastMessageTime?: number;
}

export class RateLimiter {
    private users: Map<string, UserLimitInfo> = new Map();
    private config: RateLimitConfig;
    private cleanupInterval: NodeJS.Timeout;

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = {
            windowMs: 60000,        // 1 minute window
            maxRequests: 10,        // Max 10 messages per minute
            blockDurationMs: 300000, // Block for 5 minutes
            ...config
        };

        // Clean up old entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);

        Logger.info(`🛡️ Rate limiter initialized: ${this.config.maxRequests} requests per ${this.config.windowMs/1000}s`);
    }

    /**
     * Check if user is allowed to send message
     */
    public isAllowed(userId: string, message?: string): boolean {
        const now = Date.now();
        const userInfo = this.users.get(userId) || {
            count: 0,
            windowStart: now
        };

        // Check if user is currently blocked
        if (userInfo.blockedUntil && now < userInfo.blockedUntil) {
            const remainingMs = userInfo.blockedUntil - now;
            Logger.warn(`🚫 User ${userId} is blocked for ${Math.ceil(remainingMs/1000)}s more`);
            return false;
        }

        // Check for duplicate message (same message within 2 seconds)
        if (message && userInfo.lastMessage === message && 
            userInfo.lastMessageTime && (now - userInfo.lastMessageTime) < 2000) {
            Logger.warn(`🔄 Duplicate message detected from ${userId}: "${message}"`);
            return false;
        }

        // Reset window if expired
        if (now - userInfo.windowStart >= this.config.windowMs) {
            userInfo.count = 0;
            userInfo.windowStart = now;
            userInfo.blockedUntil = undefined;
        }

        // Check rate limit
        if (userInfo.count >= this.config.maxRequests) {
            // Block user
            userInfo.blockedUntil = now + this.config.blockDurationMs;
            this.users.set(userId, userInfo);
            
            Logger.warn(`⚠️ Rate limit exceeded for ${userId}. Blocked for ${this.config.blockDurationMs/1000}s`);
            return false;
        }

        // Allow request and update counters
        userInfo.count++;
        userInfo.lastMessage = message;
        userInfo.lastMessageTime = now;
        this.users.set(userId, userInfo);

        return true;
    }

    /**
     * Get remaining requests for user
     */
    public getRemainingRequests(userId: string): number {
        const userInfo = this.users.get(userId);
        if (!userInfo) return this.config.maxRequests;

        const now = Date.now();
        
        // Check if window expired
        if (now - userInfo.windowStart >= this.config.windowMs) {
            return this.config.maxRequests;
        }

        return Math.max(0, this.config.maxRequests - userInfo.count);
    }

    /**
     * Get time until user is unblocked
     */
    public getBlockTimeRemaining(userId: string): number {
        const userInfo = this.users.get(userId);
        if (!userInfo || !userInfo.blockedUntil) return 0;

        const now = Date.now();
        return Math.max(0, userInfo.blockedUntil - now);
    }

    /**
     * Check if user is currently blocked
     */
    public isBlocked(userId: string): boolean {
        const userInfo = this.users.get(userId);
        if (!userInfo || !userInfo.blockedUntil) return false;

        const now = Date.now();
        return now < userInfo.blockedUntil;
    }

    /**
     * Manually block a user
     */
    public blockUser(userId: string, durationMs?: number): void {
        const now = Date.now();
        const userInfo = this.users.get(userId) || {
            count: 0,
            windowStart: now
        };

        userInfo.blockedUntil = now + (durationMs || this.config.blockDurationMs);
        this.users.set(userId, userInfo);

        Logger.warn(`🚫 User ${userId} manually blocked for ${(durationMs || this.config.blockDurationMs)/1000}s`);
    }

    /**
     * Unblock a user
     */
    public unblockUser(userId: string): void {
        const userInfo = this.users.get(userId);
        if (userInfo) {
            userInfo.blockedUntil = undefined;
            this.users.set(userId, userInfo);
            Logger.info(`✅ User ${userId} unblocked`);
        }
    }

    /**
     * Reset rate limit for a user
     */
    public resetUser(userId: string): void {
        this.users.delete(userId);
        Logger.info(`🔄 Rate limit reset for user ${userId}`);
    }

    /**
     * Get rate limit status for user
     */
    public getStatus(userId: string): {
        isBlocked: boolean;
        remainingRequests: number;
        blockTimeRemaining: number;
        windowResetTime: number;
    } {
        const userInfo = this.users.get(userId);
        const now = Date.now();

        if (!userInfo) {
            return {
                isBlocked: false,
                remainingRequests: this.config.maxRequests,
                blockTimeRemaining: 0,
                windowResetTime: now + this.config.windowMs
            };
        }

        return {
            isBlocked: this.isBlocked(userId),
            remainingRequests: this.getRemainingRequests(userId),
            blockTimeRemaining: this.getBlockTimeRemaining(userId),
            windowResetTime: userInfo.windowStart + this.config.windowMs
        };
    }

    /**
     * Clean up old entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [userId, userInfo] of this.users.entries()) {
            // Remove entries that are old and not blocked
            const isOldWindow = (now - userInfo.windowStart) > (this.config.windowMs * 2);
            const isNotBlocked = !userInfo.blockedUntil || now >= userInfo.blockedUntil;

            if (isOldWindow && isNotBlocked) {
                this.users.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            Logger.debug(`🧹 Cleaned up ${cleanedCount} old rate limit entries`);
        }
    }

    /**
     * Get current statistics
     */
    public getStats(): {
        totalUsers: number;
        blockedUsers: number;
        activeUsers: number;
    } {
        const now = Date.now();
        let blockedUsers = 0;
        let activeUsers = 0;

        for (const userInfo of this.users.values()) {
            if (userInfo.blockedUntil && now < userInfo.blockedUntil) {
                blockedUsers++;
            }
            
            if ((now - userInfo.windowStart) < this.config.windowMs) {
                activeUsers++;
            }
        }

        return {
            totalUsers: this.users.size,
            blockedUsers,
            activeUsers
        };
    }

    /**
     * Destroy rate limiter and cleanup
     */
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.users.clear();
        Logger.info('🛡️ Rate limiter destroyed');
    }
}

// Singleton instance for global use
export const GlobalRateLimiter = new RateLimiter({
    windowMs: 60000,     // 1 minute
    maxRequests: 8,      // Max 8 messages per minute (reasonable for normal use)
    blockDurationMs: 180000 // Block for 3 minutes
});