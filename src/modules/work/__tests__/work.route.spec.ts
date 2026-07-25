import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../work.service');
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

import workRoutes from '../work.route';
import * as WorkService from '../work.service';

const WORK_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';
const work = {
  _id: WORK_ID,
  slug: 'hospitality-growth',
  type: 'Brand Transformation',
  title: 'Hospitality growth system',
  description: 'A complete hospitality case study.',
  image: '/hospitality.jpg',
  image_alt: 'Hospitality project',
  metrics: [],
  tag_slugs: ['hospitality'],
  order: 0,
  is_published: true,
};
const page = {
  data: [work],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/work', workRoutes);
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

describe('Work routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public work list', async () => {
    (WorkService.getPublicWorks as jest.Mock).mockResolvedValue({
      data: [work],
    });

    const response = await request.get('/api/work/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([work]);
    expect(WorkService.getPublicWorks).toHaveBeenCalledTimes(1);
  });

  it('GET /public/:slug returns a published work', async () => {
    (WorkService.getPublicWorkBySlug as jest.Mock).mockResolvedValue(work);

    const response = await request.get(
      `/api/work/public/${work.slug.toUpperCase()}`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(work);
    expect(WorkService.getPublicWorkBySlug).toHaveBeenCalledWith(work.slug);
  });

  it('GET / returns the admin work list', async () => {
    (WorkService.getWorks as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/work?filter=draft');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([work]);
    expect(response.body.meta).toEqual(page.meta);
    expect(WorkService.getWorks).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'draft' }),
    );
  });

  it('GET /:id returns a work detail', async () => {
    (WorkService.getWork as jest.Mock).mockResolvedValue(work);

    const response = await request.get(`/api/work/${WORK_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(work);
    expect(WorkService.getWork).toHaveBeenCalledWith(WORK_ID);
  });

  it('POST / creates a work', async () => {
    (WorkService.createWork as jest.Mock).mockResolvedValue(work);
    const payload = {
      slug: work.slug,
      type: work.type,
      title: work.title,
      description: work.description,
      image: work.image,
      image_alt: work.image_alt,
    };

    const response = await request.post('/api/work').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(work);
    expect(WorkService.createWork).toHaveBeenCalledWith(payload);
  });

  it('POST /reorder reorders works', async () => {
    (WorkService.reorderWorks as jest.Mock).mockResolvedValue(undefined);
    const items = [
      { _id: WORK_ID, order: 1 },
      { _id: OTHER_ID, order: 0 },
    ];

    const response = await request.post('/api/work/reorder').send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(WorkService.reorderWorks).toHaveBeenCalledWith(items);
  });

  it('PATCH /:id updates a work', async () => {
    const updated = { ...work, title: 'Updated work title' };
    (WorkService.updateWork as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/work/${WORK_ID}`)
      .send({ title: updated.title });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(WorkService.updateWork).toHaveBeenCalledWith(WORK_ID, {
      title: updated.title,
    });
  });

  it('DELETE /:id/permanent permanently deletes a work', async () => {
    (WorkService.deleteWorkPermanent as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/work/${WORK_ID}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(WorkService.deleteWorkPermanent).toHaveBeenCalledWith(WORK_ID);
  });

  it('DELETE /:id soft deletes a work', async () => {
    (WorkService.deleteWork as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/work/${WORK_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(WorkService.deleteWork).toHaveBeenCalledWith(WORK_ID);
  });

  it('returns 404 when the public slug is not found', async () => {
    (WorkService.getPublicWorkBySlug as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Work not found',
    });

    const response = await request.get('/api/work/public/missing-work');

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Work not found');
  });

  it('returns 409 when the service rejects a duplicate slug', async () => {
    (WorkService.createWork as jest.Mock).mockRejectedValue({
      status: httpStatus.CONFLICT,
      message: 'A work with this slug already exists',
    });

    const response = await request.post('/api/work').send({
      slug: work.slug,
      title: work.title,
    });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body.success).toBe(false);
  });
});
