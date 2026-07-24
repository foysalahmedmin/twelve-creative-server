import { createClient, RedisClientOptions } from 'redis';
import config from './env';
import { buildRedisOptions } from './redis-options';

// A complete URL takes precedence over split host/port settings. This keeps
// container and managed-Redis deployments aligned with REDIS_URL semantics.
const redisOptions: RedisClientOptions = buildRedisOptions({
  host: config.redis_host,
  port: config.redis_port,
  password: config.redis_password,
  url: config.redis_url,
});

// Create clients with improved error handling
const cacheClient = createClient(redisOptions);
const pubClient = createClient(redisOptions);
const subClient = pubClient.duplicate();

// Redis client event listeners
(function () {
  if (!config.redis_enabled) {
    console.log('🔕 Redis disabled by configuration');
    return;
  }

  const clients = [
    { client: cacheClient, name: 'CacheClient' },
    { client: pubClient, name: 'PubClient' },
    { client: subClient, name: 'SubClient' },
  ];

  clients.forEach(({ client, name }) => {
    client.on('error', (err) => {
      console.warn(`⚠️ ${name} Redis error:`, err.message);
    });

    client.on('connect', () => {
      console.log(`✅ ${name} Redis connected`);
    });

    client.on('ready', () => {
      console.log(`🟢 ${name} Redis ready`);
    });

    client.on('end', () => {
      console.log(`🔴 ${name} Redis connection ended`);
    });
  });
})();

// Helper function to safely connect Redis
export const connectRedis = async () => {
  if (!config.redis_enabled) {
    console.log('🔕 Redis disabled by configuration');
    return false;
  }

  try {
    // Connect Cache Client
    if (!cacheClient.isOpen) {
      await cacheClient.connect();
    }
    // Connect Pub Client
    if (!pubClient.isOpen) {
      await pubClient.connect();
    }
    // Connect Sub Client
    if (!subClient.isOpen) {
      await subClient.connect();
    }
    return true;
  } catch (error) {
    console.warn('⚠️ Redis connection failed:', error);
    return false;
  }
};

// Helper function to check Redis connectivity
export const checkRedis = async (): Promise<boolean> => {
  if (!config.redis_enabled) {
    console.log('🔕 Redis disabled by configuration');
    return false;
  }

  try {
    await cacheClient.ping();
    return true;
  } catch (error) {
    console.warn('⚠️ Redis ping failed:', error);
    return false;
  }
};

export const initializeRedis = async () => {
  if (!config.redis_enabled) {
    console.log('🔕 Redis disabled by configuration');
    return;
  }

  const redisConnected = await connectRedis();
  if (redisConnected) {
    const isHealthy = await checkRedis();
    if (isHealthy) {
      console.log(
        `✅ Redis (cache) connected and healthy - PID: ${process.pid}`,
      );
    } else {
      console.warn(
        `⚠️ Redis connected but not responding - PID: ${process.pid}`,
      );
    }
  } else {
    console.warn(
      `⚠️ Redis not available, running without cache - PID: ${process.pid}`,
    );
  }
};

export { cacheClient, pubClient, subClient };
