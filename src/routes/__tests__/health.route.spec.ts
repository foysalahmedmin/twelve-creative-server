import express from 'express';
import supertest from 'supertest';
import { createReadinessHandler, livenessHandler } from '../health.route';

const buildApp = (mongoConnected: () => boolean) => {
  const app = express();
  app.get('/health', livenessHandler);
  app.get('/ready', createReadinessHandler(mongoConnected));
  return app;
};

describe('health routes', () => {
  it('keeps liveness successful independently of MongoDB readiness', async () => {
    const response = await supertest(buildApp(() => false)).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(new Date(response.body.timestamp).toString()).not.toBe(
      'Invalid Date',
    );
  });

  it('reports ready when MongoDB is connected', async () => {
    const response = await supertest(buildApp(() => true)).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ready',
      checks: { mongodb: 'up' },
    });
  });

  it('returns service unavailable when MongoDB is disconnected', async () => {
    const response = await supertest(buildApp(() => false)).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'not_ready',
      checks: { mongodb: 'down' },
    });
  });
});
