import express from 'express';
import rateLimit from 'express-rate-limit';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BookingControllers from './booking.controller';
import * as BookingValidations from './booking.validator';

const router = express.Router();

// Per-IP limit on the public submission endpoint.
// 30/hr is enough to soak up a NAT'd corporate office's legitimate traffic
// without making automated abuse trivial. Tune via env if a real campaign hits it.
const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking requests from this IP. Please try again later.',
  },
});

// ─── Public ──────────────────────────────────────────────────────────────────
router.post(
  '/public',
  publicSubmitLimiter,
  validation(BookingValidations.createBookingValidationSchema),
  BookingControllers.submitBooking,
);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.get(
  '/pending-count',
  auth('admin', 'editor'),
  BookingControllers.getPendingCount,
);

router.get('/', auth('admin', 'editor'), BookingControllers.getBookings);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(BookingValidations.bookingIdSchema),
  BookingControllers.getBooking,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(BookingValidations.updateBookingValidationSchema),
  BookingControllers.updateBooking,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(BookingValidations.bookingIdSchema),
  BookingControllers.deleteBookingPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(BookingValidations.bookingIdSchema),
  BookingControllers.deleteBooking,
);

const bookingRoutes = router;
export default bookingRoutes;
