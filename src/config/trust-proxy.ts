import type { Application } from 'express';

export const TRUST_PROXY_HOPS = 1;

export const configureTrustProxy = (app: Application): void => {
  app.set('trust proxy', TRUST_PROXY_HOPS);
};
