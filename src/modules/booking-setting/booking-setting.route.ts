import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BookingSettingControllers from './booking-setting.controller';
import { updateBookingSettingValidationSchema } from './booking-setting.validator';

const router = express.Router();

router.get('/public', BookingSettingControllers.getPublicBookingSetting);

router.get(
  '/',
  auth('admin', 'editor'),
  BookingSettingControllers.getBookingSetting,
);

router.patch(
  '/',
  auth('admin', 'editor'),
  validation(updateBookingSettingValidationSchema),
  BookingSettingControllers.updateBookingSetting,
);

const bookingSettingRoutes = router;
export default bookingSettingRoutes;
