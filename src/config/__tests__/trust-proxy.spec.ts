import express from 'express';
import supertest from 'supertest';
import { configureTrustProxy, TRUST_PROXY_HOPS } from '../trust-proxy';

const buildApp = () => {
  const app = express();
  configureTrustProxy(app);
  app.get('/client', (req, res) => {
    res.json({ ip: req.ip, ips: req.ips, protocol: req.protocol });
  });
  return app;
};

describe('trust proxy configuration', () => {
  it('trusts exactly one reverse-proxy hop', () => {
    const app = buildApp();

    expect(TRUST_PROXY_HOPS).toBe(1);
    expect(app.get('trust proxy')).toBe(1);
  });

  it('uses only the nearest forwarded address from a proxy chain', async () => {
    const response = await supertest(buildApp())
      .get('/client')
      .set('X-Forwarded-For', '198.51.100.10, 203.0.113.20')
      .set('X-Forwarded-Proto', 'https');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ip: '203.0.113.20',
      ips: ['203.0.113.20'],
      protocol: 'https',
    });
  });
});
