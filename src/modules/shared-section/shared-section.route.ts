import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as SharedSectionControllers from './shared-section.controller';
import * as SharedSectionValidations from './shared-section.validator';

const router = express.Router();

router.get(
  '/public/:key',
  validation(SharedSectionValidations.sharedSectionKeySchema),
  SharedSectionControllers.getPublicSharedSection,
);

router.get(
  '/',
  auth('admin', 'editor'),
  SharedSectionControllers.getSharedSections,
);

router.get(
  '/:key',
  auth('admin', 'editor'),
  validation(SharedSectionValidations.sharedSectionKeySchema),
  SharedSectionControllers.getSharedSection,
);

router.put(
  '/:key',
  auth('admin', 'editor'),
  validation(SharedSectionValidations.updateSharedSectionValidationSchema),
  SharedSectionControllers.updateSharedSection,
);

const sharedSectionRoutes = router;
export default sharedSectionRoutes;
