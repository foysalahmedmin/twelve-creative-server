import express from 'express';
import rateLimit from 'express-rate-limit';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BookingControllers from './booking.controller';
import * as BookingValidations from './booking.validator';

const router = express.Router();

// Stricter per-IP limit on the public submission endpoint.
const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
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
