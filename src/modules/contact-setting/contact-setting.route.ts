import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ContactSettingControllers from './contact-setting.controller';
import { updateContactSettingValidationSchema } from './contact-setting.validator';

const router = express.Router();

router.get('/public', ContactSettingControllers.getPublicContactSetting);

router.get(
  '/',
  auth('admin', 'editor'),
  ContactSettingControllers.getContactSetting,
);

router.patch(
  '/',
  auth('admin', 'editor'),
  validation(updateContactSettingValidationSchema),
  ContactSettingControllers.updateContactSetting,
);

const contactSettingRoutes = router;
export default contactSettingRoutes;
