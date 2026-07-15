import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as IndustryControllers from './industry.controller';
import * as IndustryValidations from './industry.validator';

const router = express.Router();

router.get('/public', IndustryControllers.getPublicIndustries);

router.get(
  '/options',
  auth('admin', 'editor'),
  IndustryControllers.getIndustryOptions,
);

router.get('/', auth('admin', 'editor'), IndustryControllers.getIndustries);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(IndustryValidations.industryIdSchema),
  IndustryControllers.getIndustry,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(IndustryValidations.createIndustryValidationSchema),
  IndustryControllers.createIndustry,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(IndustryValidations.reorderIndustriesValidationSchema),
  IndustryControllers.reorderIndustries,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(IndustryValidations.industryIdSchema),
  IndustryControllers.restoreIndustry,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(IndustryValidations.updateIndustryValidationSchema),
  IndustryControllers.updateIndustry,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(IndustryValidations.industryIdSchema),
  IndustryControllers.deleteIndustryPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(IndustryValidations.industryIdSchema),
  IndustryControllers.deleteIndustry,
);

const industryRoutes = router;
export default industryRoutes;
