import { buildRedisOptions } from '../redis-options';

describe('Redis client options', () => {
  it('prefers a complete Redis URL over split connection fields', () => {
    const options = buildRedisOptions({
      url: 'redis://:secret@redis.internal:6379/0',
      host: 'localhost',
      port: '6380',
    });

    expect(options.url).toBe('redis://:secret@redis.internal:6379/0');
    expect(options.socket).not.toEqual(
      expect.objectContaining({ host: 'localhost', port: 6380 }),
    );
  });

  it('uses host, port, and password when no URL is configured', () => {
    const options = buildRedisOptions({
      host: 'redis',
      port: '6380',
      password: 'secret',
    });

    expect(options).toMatchObject({
      password: 'secret',
      socket: { host: 'redis', port: 6380, connectTimeout: 5000 },
    });
  });
});
