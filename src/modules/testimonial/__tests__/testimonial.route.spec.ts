import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';
import AppError from '../../../builder/app-error';

jest.mock('../testimonial.service');
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

import testimonialRoutes from '../testimonial.route';
import * as TestimonialService from '../testimonial.service';

const TESTIMONIAL_ID = '507f1f77bcf86cd799439031';
const testimonial = {
  _id: TESTIMONIAL_ID,
  name: 'Jordan Lee',
  designation: 'Founder, Meridian',
  image: '/testimonials/jordan.jpg',
  category: 'message',
  message: 'Twelve Creative transformed how our brand shows up everywhere.',
  order: 1,
  is_active: true,
};
const meta = { total: 1, page: 1, limit: 10, total_pages: 1 };

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/testimonial', testimonialRoutes);
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

describe('Testimonial routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns public testimonials', async () => {
    (TestimonialService.getPublicTestimonials as jest.Mock).mockResolvedValue({
      data: [testimonial],
    });

    const response = await request.get('/api/testimonial/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([testimonial]);
  });

  it('GET / returns the paginated admin list', async () => {
    (TestimonialService.getTestimonials as jest.Mock).mockResolvedValue({
      data: [testimonial],
      meta,
    });

    const response = await request.get('/api/testimonial?page=2&filter=active');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.meta).toEqual(meta);
    expect(TestimonialService.getTestimonials).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2', filter: 'active' }),
    );
  });

  it('GET /:id returns one testimonial', async () => {
    (TestimonialService.getTestimonial as jest.Mock).mockResolvedValue(
      testimonial,
    );

    const response = await request.get(`/api/testimonial/${TESTIMONIAL_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(testimonial);
    expect(TestimonialService.getTestimonial).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
    );
  });

  it('GET /:id forwards a missing-testimonial error', async () => {
    (TestimonialService.getTestimonial as jest.Mock).mockRejectedValue(
      new AppError(httpStatus.NOT_FOUND, 'Testimonial not found'),
    );

    const response = await request.get(`/api/testimonial/${TESTIMONIAL_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Testimonial not found');
  });

  it('POST / creates a testimonial', async () => {
    (TestimonialService.createTestimonial as jest.Mock).mockResolvedValue(
      testimonial,
    );

    const response = await request.post('/api/testimonial').send(testimonial);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(testimonial);
    expect(TestimonialService.createTestimonial).toHaveBeenCalledWith(
      testimonial,
    );
  });

  it('POST /reorder forwards ordered items', async () => {
    const items = [{ _id: TESTIMONIAL_ID, order: 2 }];
    (TestimonialService.reorderTestimonials as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request
      .post('/api/testimonial/reorder')
      .send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(TestimonialService.reorderTestimonials).toHaveBeenCalledWith(items);
  });

  it('POST /:id/restore restores a testimonial', async () => {
    (TestimonialService.restoreTestimonial as jest.Mock).mockResolvedValue(
      testimonial,
    );

    const response = await request.post(
      `/api/testimonial/${TESTIMONIAL_ID}/restore`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(testimonial);
    expect(TestimonialService.restoreTestimonial).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
    );
  });

  it('POST /:id/restore returns 404 when nothing can be restored', async () => {
    (TestimonialService.restoreTestimonial as jest.Mock).mockRejectedValue(
      new AppError(
        httpStatus.NOT_FOUND,
        'Testimonial not found or not deleted',
      ),
    );

    const response = await request.post(
      `/api/testimonial/${TESTIMONIAL_ID}/restore`,
    );

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('PATCH /:id updates a testimonial', async () => {
    const updated = { ...testimonial, designation: 'CEO, Meridian' };
    (TestimonialService.updateTestimonial as jest.Mock).mockResolvedValue(
      updated,
    );

    const response = await request
      .patch(`/api/testimonial/${TESTIMONIAL_ID}`)
      .send({ designation: updated.designation });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.designation).toBe(updated.designation);
    expect(TestimonialService.updateTestimonial).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
      { designation: updated.designation },
    );
  });

  it('DELETE /:id/permanent permanently deletes a testimonial', async () => {
    (
      TestimonialService.deleteTestimonialPermanent as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(
      `/api/testimonial/${TESTIMONIAL_ID}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(TestimonialService.deleteTestimonialPermanent).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
    );
  });

  it('DELETE /:id soft deletes a testimonial', async () => {
    (TestimonialService.deleteTestimonial as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/testimonial/${TESTIMONIAL_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(TestimonialService.deleteTestimonial).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
    );
  });
});
