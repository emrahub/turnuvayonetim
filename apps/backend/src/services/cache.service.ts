/**
 * Redis Caching Service
 * High-performance caching layer for frequently accessed data
 */

import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour in seconds

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');

    this.redis.on('connect', () => {
      console.log('✅ Redis cache connected');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis cache error:', err);
    });
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      await this.redis.setex(key, expiry, serialized);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Store in cache
    await this.set(key, fresh, ttl);

    return fresh;
  }

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      console.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset(items: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value] of Object.entries(items)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.error(`Cache mset error:`, error);
    }
  }

  /**
   * Cache tournament data
   */
  async cacheTournament(tournamentId: string, data: any, ttl = 300): Promise<void> {
    await this.set(`tournament:${tournamentId}`, data, ttl);
  }

  /**
   * Get cached tournament
   */
  async getCachedTournament(tournamentId: string): Promise<any | null> {
    return await this.get(`tournament:${tournamentId}`);
  }

  /**
   * Invalidate tournament cache
   */
  async invalidateTournament(tournamentId: string): Promise<void> {
    await this.delPattern(`tournament:${tournamentId}*`);
  }

  /**
   * Cache leaderboard
   */
  async cacheLeaderboard(key: string, data: any, ttl = 600): Promise<void> {
    await this.set(`leaderboard:${key}`, data, ttl);
  }

  /**
   * Cache analytics
   */
  async cacheAnalytics(key: string, data: any, ttl = 900): Promise<void> {
    await this.set(`analytics:${key}`, data, ttl);
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${identifier}`;
    const current = await this.incr(key, windowSeconds);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current)
    };
  }

  /**
   * Store session data
   */
  async setSession(sessionId: string, data: any, ttl = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    return await this.get(`session:${sessionId}`);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * Pub/Sub for real-time updates
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error(`Publish error on channel ${channel}:`, error);
    }
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, callback: (message: any) => void): void {
    const subscriber = this.redis.duplicate();

    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Subscribe error on channel ${channel}:`, err);
      }
    });

    subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(msg);
          callback(parsed);
        } catch (error) {
          console.error(`Message parse error on channel ${channel}:`, error);
        }
      }
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();

      // Parse info string
      const stats: Record<string, string> = {};
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        keys: dbSize,
        memory: stats['used_memory_human'] || '0',
        hits: parseInt(stats['keyspace_hits'] || '0'),
        misses: parseInt(stats['keyspace_misses'] || '0')
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: '0', hits: 0, misses: 0 };
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      console.log('⚠️ Cache flushed');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}
