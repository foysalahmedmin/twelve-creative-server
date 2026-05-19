import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as SiteSettingControllers from './site-setting.controller';
import * as SiteSettingValidations from './site-setting.validator';

const router = express.Router();

// Public read — used by the footer + contact pages.
router.get('/public', SiteSettingControllers.getSiteSetting);

router.get('/', auth('admin', 'editor'), SiteSettingControllers.getSiteSetting);

router.patch(
  '/',
  auth('admin'),
  validation(SiteSettingValidations.updateSiteSettingValidationSchema),
  SiteSettingControllers.updateSiteSetting,
);

const siteSettingRoutes = router;
export default siteSettingRoutes;
