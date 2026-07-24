import type { RequestHandler } from 'express';
import mongoose from 'mongoose';

export const isMongoConnected = (): boolean =>
  mongoose.connection.readyState === 1;

export const livenessHandler: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

export const createReadinessHandler = (
  mongoConnected: () => boolean = isMongoConnected,
): RequestHandler => {
  return (_req, res) => {
    const isReady = mongoConnected();

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      checks: {
        mongodb: isReady ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    });
  };
};

export const readinessHandler = createReadinessHandler();
