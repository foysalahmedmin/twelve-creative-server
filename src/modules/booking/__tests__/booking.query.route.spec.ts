import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { ZodError } from 'zod';

jest.mock('../booking.service');
jest.mock('express-rate-limit', () =>
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
jest.mock('../../../middlewares/auth.middleware', () =>
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

import bookingRoutes from '../booking.route';
import * as BookingService from '../booking.service';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/booking', bookingRoutes);
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
        });
        return;
      }
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false });
    },
  );
  return app;
};

const request = supertest(buildApp());

describe('Booking admin list query validation route', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('allows the documented query surface through to the list service', async () => {
    (BookingService.getBookings as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 2, limit: 50, total_pages: 0 },
    });

    const response = await request.get(
      '/api/booking?page=2&limit=50&filter=pending&sort=-created_at,name&fields=name,email,status&search=Taylor',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(BookingService.getBookings).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 50,
        filter: 'pending',
        sort: '-created_at,name',
        fields: 'name,email,status',
        search: 'Taylor',
      }),
    );
  });

  it.each([
    'page=0',
    'page=100001',
    'limit=101',
    'filter=unknown',
    'sort=-password',
    'fields=name,password',
    'fields=name,-internal_note',
    'unexpected=value',
    'filter=pending&status=completed',
  ])('rejects an unsafe or unsupported query: %s', async (query) => {
    const response = await request.get(`/api/booking?${query}`);

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(BookingService.getBookings).not.toHaveBeenCalled();
  });
});
