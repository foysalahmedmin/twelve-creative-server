import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../insight.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        (
          req as express.Request & { user: { _id: string; role: string } }
        ).user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@example.com',
        };
        next();
      },
  ),
);
jest.mock('../../../middlewares/validation.middleware', () =>
  jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  ),
);

import insightRoutes from '../insight.route';
import * as InsightService from '../insight.service';

const INSIGHT_ID = '507f1f77bcf86cd799439011';
const insight = {
  _id: INSIGHT_ID,
  slug: 'brand-strategy',
  title: 'Brand strategy guide',
  excerpt: 'A practical introduction to brand strategy.',
  cover: '/brand-strategy.jpg',
  content: 'Long-form insight content used by the route tests.',
  status: 'published',
};
const page = {
  data: [insight],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/insight', insightRoutes);
  app.use(
    (
      err: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    },
  );
  return app;
};

const request = supertest(buildApp());

describe('Insight routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public insight list', async () => {
    (InsightService.getPublicInsights as jest.Mock).mockResolvedValue({
      data: [insight],
    });

    const response = await request.get('/api/insight/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([insight]);
    expect(InsightService.getPublicInsights).toHaveBeenCalledTimes(1);
  });

  it('GET /public/:slug returns a published insight', async () => {
    (InsightService.getPublicInsightBySlug as jest.Mock).mockResolvedValue(
      insight,
    );

    const response = await request.get(
      `/api/insight/public/${insight.slug.toUpperCase()}`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(insight);
    expect(InsightService.getPublicInsightBySlug).toHaveBeenCalledWith(
      insight.slug,
    );
  });

  it('GET / returns the admin insight list', async () => {
    (InsightService.getInsights as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/insight?filter=draft');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([insight]);
    expect(response.body.meta).toEqual(page.meta);
    expect(InsightService.getInsights).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'draft' }),
    );
  });

  it('GET /:id returns an insight detail', async () => {
    (InsightService.getInsight as jest.Mock).mockResolvedValue(insight);

    const response = await request.get(`/api/insight/${INSIGHT_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(insight);
    expect(InsightService.getInsight).toHaveBeenCalledWith(INSIGHT_ID);
  });

  it('POST / creates an insight', async () => {
    (InsightService.createInsight as jest.Mock).mockResolvedValue(insight);
    const payload = {
      slug: insight.slug,
      title: insight.title,
      excerpt: insight.excerpt,
      cover: insight.cover,
      content: insight.content,
      status: insight.status,
    };

    const response = await request.post('/api/insight').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(insight);
    expect(InsightService.createInsight).toHaveBeenCalledWith(payload);
  });

  it('PATCH /:id updates an insight', async () => {
    const updated = { ...insight, title: 'Updated insight title' };
    (InsightService.updateInsight as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/insight/${INSIGHT_ID}`)
      .send({ title: updated.title });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(InsightService.updateInsight).toHaveBeenCalledWith(INSIGHT_ID, {
      title: updated.title,
    });
  });

  it('DELETE /:id/permanent permanently deletes an insight', async () => {
    (InsightService.deleteInsightPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(
      `/api/insight/${INSIGHT_ID}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(InsightService.deleteInsightPermanent).toHaveBeenCalledWith(
      INSIGHT_ID,
    );
  });

  it('DELETE /:id soft deletes an insight', async () => {
    (InsightService.deleteInsight as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/insight/${INSIGHT_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(InsightService.deleteInsight).toHaveBeenCalledWith(INSIGHT_ID);
  });

  it('returns 404 when the public slug is not found', async () => {
    (InsightService.getPublicInsightBySlug as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Insight not found',
    });

    const response = await request.get('/api/insight/public/missing-insight');

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Insight not found');
  });

  it('returns 409 when the service rejects a duplicate slug', async () => {
    (InsightService.createInsight as jest.Mock).mockRejectedValue({
      status: httpStatus.CONFLICT,
      message: 'An insight with this slug already exists',
    });

    const response = await request.post('/api/insight').send({
      slug: insight.slug,
      title: insight.title,
    });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body.success).toBe(false);
  });
});
