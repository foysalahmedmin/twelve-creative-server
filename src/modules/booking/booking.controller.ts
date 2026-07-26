import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as BookingServices from './booking.service';
import { adminBookingsQuerySchema } from './booking.validator';

// Public — anyone can submit
export const submitBooking = catchAsync(async (req, res) => {
  await BookingServices.createBooking(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message:
      'Your booking request has been received. We will reach out within 24 hours.',
    data: null,
  });
});

// Admin
export const getBookings = catchAsync(async (req, res) => {
  // The shared validation middleware intentionally only replaces request
  // bodies. Parse again here so trimmed/coerced query values, rather than the
  // raw Express query object, are the only values forwarded to persistence.
  const { query } = adminBookingsQuerySchema.parse({ query: req.query });
  const result = await BookingServices.getBookings(query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getBooking = catchAsync(async (req, res) => {
  const result = await BookingServices.getBooking(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

export const updateBooking = catchAsync(async (req, res) => {
  const result = await BookingServices.updateBooking(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

export const deleteBooking = catchAsync(async (req, res) => {
  await BookingServices.deleteBooking(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking deleted successfully',
    data: null,
  });
});

export const deleteBookingPermanent = catchAsync(async (req, res) => {
  await BookingServices.deleteBookingPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking permanently deleted',
    data: null,
  });
});

export const getPendingCount = catchAsync(async (_req, res) => {
  const count = await BookingServices.getPendingCount();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Pending count',
    data: { count },
  });
});
