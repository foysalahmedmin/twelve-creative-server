import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

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

import bookingRoutes from '../booking.route';
import * as BookingService from '../booking.service';

const app = express();
app.use(express.json());
app.use('/api/booking', bookingRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? 500)
      .json({ success: false, message: error.message });
  },
);
const request = supertest(app);

const id = '507f1f77bcf86cd799439011';
const booking = {
  _id: id,
  name: 'Taylor',
  email: 'taylor@example.com',
  status: 'pending',
  source: 'booking_form',
};

describe('Booking routes', () => {
  it('POST /public submits a booking without returning private data', async () => {
    (BookingService.createBooking as jest.Mock).mockResolvedValue(booking);
    const payload = { name: booking.name, email: booking.email };

    const response = await request.post('/api/booking/public').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toBeNull();
    expect(BookingService.createBooking).toHaveBeenCalledWith(payload);
  });

  it('GET /pending-count returns the pending count', async () => {
    (BookingService.getPendingCount as jest.Mock).mockResolvedValue(4);

    const response = await request.get('/api/booking/pending-count');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual({ count: 4 });
  });

  it('GET / returns paginated bookings', async () => {
    (BookingService.getBookings as jest.Mock).mockResolvedValue({
      data: [booking],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get('/api/booking?status=pending');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([booking]);
    expect(response.body.meta.total).toBe(1);
    expect(BookingService.getBookings).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
  });

  it('GET /:id returns one booking', async () => {
    (BookingService.getBooking as jest.Mock).mockResolvedValue(booking);

    const response = await request.get(`/api/booking/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(booking);
    expect(BookingService.getBooking).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates one booking', async () => {
    const updated = { ...booking, status: 'completed' };
    (BookingService.updateBooking as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/booking/${id}`)
      .send({ status: 'completed' });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.status).toBe('completed');
    expect(BookingService.updateBooking).toHaveBeenCalledWith(id, {
      status: 'completed',
    });
  });

  it('DELETE /:id/permanent permanently deletes one booking', async () => {
    (BookingService.deleteBookingPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/booking/${id}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(BookingService.deleteBookingPermanent).toHaveBeenCalledWith(id);
  });

  it('DELETE /:id soft-deletes one booking', async () => {
    (BookingService.deleteBooking as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/booking/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(BookingService.deleteBooking).toHaveBeenCalledWith(id);
  });

  it('passes service errors to the route error handler', async () => {
    (BookingService.getBooking as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Booking not found',
    });

    const response = await request.get(`/api/booking/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Booking not found',
    });
  });
});
