/* eslint-disable no-console */
import config from '../config/env';
import { cacheClient } from '../config/redis';

/**
 * Higher-order function to wrap a function with caching logic.
 * @param key The Redis key to use for caching.
 * @param ttl Time-to-live in seconds.
 * @param fn The function to execute if cache misses.
 */
export const generateCacheKey = (prefix: string, parts: unknown[]): string => {
  const processPart = (part: unknown): string => {
    if (part === null || part === undefined) return '';
    if (typeof part === 'object') {
      // Stable stringify for objects
      return JSON.stringify(
        Object.keys(part as Record<string, unknown>)
          .sort()
          .reduce((acc: Record<string, unknown>, key) => {
            acc[key] = (part as Record<string, unknown>)[key];
            return acc;
          }, {}),
      );
    }
    return String(part);
  };

  return `${prefix}:${parts.map(processPart).join(':')}`;
};

export const withCache = async <T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> => {
  if (!config.redis_enabled) {
    return await fn();
  }

  try {
    const cachedData = await cacheClient.get(key);
    if (cachedData) {
      console.log(`✅ [Redis Cache] HIT - Key: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`❌ [Redis Cache] MISS - Key: ${key}. Fetching from DB...`);
    const result = await fn();
    if (result !== undefined && result !== null) {
      await cacheClient.set(key, JSON.stringify(result), { EX: ttl });
      console.log(`💾 [Redis Cache] SAVED - Key: ${key} (TTL: ${ttl}s)`);
    }
    return result;
  } catch (error) {
    console.warn(`Cache error for key ${key}:`, error);
    return await fn();
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> => {
  if (!config.redis_enabled) return;
  try {
    await cacheClient.set(key, value, { EX: ttlSeconds });
  } catch (error) {
    console.warn(`setCache error for key ${key}:`, error);
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  if (!config.redis_enabled) return null;
  try {
    return await cacheClient.get(key);
  } catch (error) {
    console.warn(`getCache error for key ${key}:`, error);
    return null;
  }
};

/**
 * Invalidate a specific cache key or multiple keys.
 * @param keys Key or array of keys to invalidate.
 */
export const invalidateCache = async (keys: string | string[]) => {
  if (!config.redis_enabled) return;

  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length > 0) {
      await cacheClient.del(keysArray);
    }
  } catch (error) {
    console.warn(`Invalidate cache error:`, error);
  }
};

/**
 * Invalidate cache keys matching a pattern.
 * Note: Use with caution as KEYS/SCAN can be expensive on large datasets.
 * @param pattern The pattern to match (e.g., 'package:*')
 */
export const invalidateCacheByPattern = async (pattern: string) => {
  if (!config.redis_enabled) return;

  try {
    // Using SCAN instead of KEYS for better performance and to avoid blocking
    let cursor = '0';
    do {
      const reply = await cacheClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = reply.cursor.toString();
      if (reply.keys.length > 0) {
        await cacheClient.del(reply.keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.warn(`Invalidate pattern cache error:`, error);
  }
};
