import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PageCtaControllers from './page-cta.controller';
import * as PageCtaValidations from './page-cta.validator';

const router = express.Router();

router.get(
  '/public/:placement',
  validation(PageCtaValidations.publicPageCtaSchema),
  PageCtaControllers.getPublicPageCta,
);

router.get(
  '/',
  auth('admin', 'editor'),
  validation(PageCtaValidations.adminPageCtasQuerySchema),
  PageCtaControllers.getPageCtas,
);

router.put(
  '/upsert',
  auth('admin', 'editor'),
  validation(PageCtaValidations.upsertPageCtaValidationSchema),
  PageCtaControllers.upsertPageCta,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(PageCtaValidations.pageCtaIdSchema),
  PageCtaControllers.getPageCta,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(PageCtaValidations.createPageCtaValidationSchema),
  PageCtaControllers.createPageCta,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(PageCtaValidations.updatePageCtaValidationSchema),
  PageCtaControllers.updatePageCta,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(PageCtaValidations.pageCtaIdSchema),
  PageCtaControllers.deletePageCta,
);

const pageCtaRoutes = router;
export default pageCtaRoutes;
