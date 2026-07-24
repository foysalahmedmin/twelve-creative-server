import type { Request } from 'express';
import config from '../../config/env';

type RequestOrigin = Pick<Request, 'protocol' | 'get'>;

export type FileUrlRuntime = {
  nodeEnv?: string;
  publicUrl?: string;
};

const normalizeHttpBaseUrl = (value?: string): string | undefined => {
  if (!value?.trim()) return undefined;

  try {
    const parsed = new URL(value.trim());
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      return undefined;
    }

    parsed.search = '';
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
};

export const resolveFileBaseUrl = (
  req: RequestOrigin,
  runtime: FileUrlRuntime = {
    nodeEnv: config.node_env,
    publicUrl: config.url,
  },
): string => {
  const configuredBaseUrl = normalizeHttpBaseUrl(runtime.publicUrl);
  const host = req.get('host');
  const requestBaseUrl = normalizeHttpBaseUrl(
    host ? `${req.protocol}://${host}` : undefined,
  );

  if (runtime.nodeEnv === 'production' && configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return requestBaseUrl ?? configuredBaseUrl ?? '';
};
