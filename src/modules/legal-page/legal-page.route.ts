import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as LegalPageControllers from './legal-page.controller';
import * as LegalPageValidations from './legal-page.validator';

const router = express.Router();

router.get(
  '/public/:slug',
  validation(LegalPageValidations.legalPageSlugParamsSchema),
  LegalPageControllers.getPublicLegalPage,
);

router.get('/', auth('admin', 'editor'), LegalPageControllers.getLegalPages);

router.get(
  '/:slug',
  auth('admin', 'editor'),
  validation(LegalPageValidations.legalPageSlugParamsSchema),
  LegalPageControllers.getLegalPage,
);

router.put(
  '/:slug',
  auth('admin', 'editor'),
  validation(LegalPageValidations.upsertLegalPageValidationSchema),
  LegalPageControllers.upsertLegalPage,
);

const legalPageRoutes = router;
export default legalPageRoutes;
