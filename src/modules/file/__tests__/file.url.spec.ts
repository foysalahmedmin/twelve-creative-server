import type { Request } from 'express';
import { resolveFileBaseUrl } from '../file.url';

const requestFromInternalProxy = {
  protocol: 'http',
  get: jest.fn((header: string) =>
    header.toLowerCase() === 'host' ? '127.0.0.1:5003' : undefined,
  ),
} as unknown as Pick<Request, 'protocol' | 'get'>;

describe('local file URL base resolution', () => {
  it('uses the configured public HTTPS URL for an internal production request', () => {
    const result = resolveFileBaseUrl(requestFromInternalProxy, {
      nodeEnv: 'production',
      publicUrl: ' https://api.twelvecreative.com///?internal=ignored#hash ',
    });

    expect(result).toBe('https://api.twelvecreative.com');
  });

  it('falls back safely to the request origin when production URL is invalid', () => {
    const result = resolveFileBaseUrl(requestFromInternalProxy, {
      nodeEnv: 'production',
      publicUrl: 'not-a-public-url',
    });

    expect(result).toBe('http://127.0.0.1:5003');
  });

  it('keeps request-origin behavior outside production', () => {
    const result = resolveFileBaseUrl(requestFromInternalProxy, {
      nodeEnv: 'development',
      publicUrl: 'https://api.twelvecreative.com',
    });

    expect(result).toBe('http://127.0.0.1:5003');
  });
});
