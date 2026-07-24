import type { RedisClientOptions } from 'redis';

export type RedisConnectionConfig = {
  host?: string;
  port?: string;
  password?: string;
  url?: string;
};

const reconnectStrategy = (retries: number): false | number => {
  if (retries > 0) return false;
  return Math.min(retries * 100, 3000);
};

export const buildRedisOptions = ({
  host,
  port,
  password,
  url,
}: RedisConnectionConfig): RedisClientOptions => {
  const socket = {
    connectTimeout: 5000,
    reconnectStrategy,
  };

  const options: RedisClientOptions = url
    ? { url, socket }
    : {
        socket: {
          ...socket,
          host: host || 'localhost',
          port: Number(port || '6379'),
        },
      };

  if (password && !url) options.password = password;
  return options;
};
