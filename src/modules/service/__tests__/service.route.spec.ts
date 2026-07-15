import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';
import AppError from '../../../builder/app-error';

jest.mock('../service.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        (req as express.Request & { user: unknown }).user = {
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

import serviceRoutes from '../service.route';
import * as ServiceService from '../service.service';

const SERVICE_ID = '507f1f77bcf86cd799439011';
const service = {
  _id: SERVICE_ID,
  slug: 'positioning',
  title: 'Brand Positioning',
  description: 'A clear positioning system for ambitious brands.',
  highlights: ['Research'],
  image: '/services/positioning.jpg',
  icon: 'positioning',
  order: 1,
  is_active: true,
};
const meta = { total: 1, page: 1, limit: 10, total_pages: 1 };

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/service', serviceRoutes);
  app.use(
    (
      error: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(error.status ?? 500).json({
        success: false,
        message: error.message ?? 'Internal Server Error',
      });
    },
  );
  return app;
};

const request = supertest(buildApp());

describe('Service routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns public services', async () => {
    (ServiceService.getPublicServices as jest.Mock).mockResolvedValue({
      data: [service],
    });

    const response = await request.get('/api/service/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([service]);
  });

  it('GET / returns the paginated admin list and forwards query params', async () => {
    (ServiceService.getServices as jest.Mock).mockResolvedValue({
      data: [service],
      meta,
    });

    const response = await request.get(
      '/api/service?page=2&filter=active&search=brand',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.meta).toEqual(meta);
    expect(ServiceService.getServices).toHaveBeenCalledWith(
      expect.objectContaining({
        page: '2',
        filter: 'active',
        search: 'brand',
      }),
    );
  });

  it('GET /:id returns one service', async () => {
    (ServiceService.getService as jest.Mock).mockResolvedValue(service);

    const response = await request.get(`/api/service/${SERVICE_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(service);
    expect(ServiceService.getService).toHaveBeenCalledWith(SERVICE_ID);
  });

  it('GET /:id serializes a missing-service error', async () => {
    (ServiceService.getService as jest.Mock).mockRejectedValue(
      new AppError(httpStatus.NOT_FOUND, 'Service not found'),
    );

    const response = await request.get(`/api/service/${SERVICE_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Service not found',
    });
  });

  it('POST / creates a service', async () => {
    (ServiceService.createService as jest.Mock).mockResolvedValue(service);

    const response = await request.post('/api/service').send(service);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(service);
    expect(ServiceService.createService).toHaveBeenCalledWith(service);
  });

  it('POST /reorder forwards ordered items', async () => {
    const items = [{ _id: SERVICE_ID, order: 2 }];
    (ServiceService.reorderServices as jest.Mock).mockResolvedValue(undefined);

    const response = await request.post('/api/service/reorder').send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ServiceService.reorderServices).toHaveBeenCalledWith(items);
  });

  it('POST /:id/restore restores a service', async () => {
    (ServiceService.restoreService as jest.Mock).mockResolvedValue(service);

    const response = await request.post(`/api/service/${SERVICE_ID}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(service);
    expect(ServiceService.restoreService).toHaveBeenCalledWith(SERVICE_ID);
  });

  it('POST /:id/restore returns 404 when nothing can be restored', async () => {
    (ServiceService.restoreService as jest.Mock).mockRejectedValue(
      new AppError(httpStatus.NOT_FOUND, 'Service not found or not deleted'),
    );

    const response = await request.post(`/api/service/${SERVICE_ID}/restore`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('PATCH /:id updates a service', async () => {
    const updated = { ...service, title: 'Updated positioning' };
    (ServiceService.updateService as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/service/${SERVICE_ID}`)
      .send({ title: updated.title });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.title).toBe(updated.title);
    expect(ServiceService.updateService).toHaveBeenCalledWith(SERVICE_ID, {
      title: updated.title,
    });
  });

  it('DELETE /:id/permanent permanently deletes a service', async () => {
    (ServiceService.deleteServicePermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(
      `/api/service/${SERVICE_ID}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(ServiceService.deleteServicePermanent).toHaveBeenCalledWith(
      SERVICE_ID,
    );
  });

  it('DELETE /:id soft deletes a service', async () => {
    (ServiceService.deleteService as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/service/${SERVICE_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(ServiceService.deleteService).toHaveBeenCalledWith(SERVICE_ID);
  });
});
