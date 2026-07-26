import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as AboutPageControllers from './about-page.controller';
import { updateAboutPageValidationSchema } from './about-page.validator';

const router = express.Router();

router.get('/public', AboutPageControllers.getPublicAboutPage);
router.get('/', auth('admin', 'editor'), AboutPageControllers.getAboutPage);
router.patch(
  '/',
  auth('admin', 'editor'),
  validation(updateAboutPageValidationSchema),
  AboutPageControllers.updateAboutPage,
);

const aboutPageRoutes = router;
export default aboutPageRoutes;
