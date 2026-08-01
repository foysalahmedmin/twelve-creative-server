import express from 'express';
import auth from '../../middlewares/auth.middleware';
import { rateLimiter } from '../../middlewares/rate-limit.middleware';
import validation from '../../middlewares/validation.middleware';
import * as SiteSettingControllers from './site-setting.controller';
import * as SiteSettingValidations from './site-setting.validator';

const router = express.Router();

// Verifying an address takes a handful of sends, never a stream of them — and
// the shared mailbox has a daily send quota worth protecting.
const testEmailRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many test emails. Please wait a few minutes and try again.',
  },
});

// Public read — used by the footer + contact pages.
router.get('/public', SiteSettingControllers.getPublicSiteSetting);

router.get('/', auth('admin', 'editor'), SiteSettingControllers.getSiteSetting);

router.post(
  '/notification-email/test',
  auth('admin'),
  testEmailRateLimiter,
  SiteSettingControllers.sendTestNotificationEmail,
);

router.patch(
  '/',
  auth('admin'),
  validation(SiteSettingValidations.updateSiteSettingValidationSchema),
  SiteSettingControllers.updateSiteSetting,
);

const siteSettingRoutes = router;
export default siteSettingRoutes;
