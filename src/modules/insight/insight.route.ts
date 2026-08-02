import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as InsightControllers from './insight.controller';
import * as InsightValidations from './insight.validator';

const router = express.Router();

router.get('/public', InsightControllers.getPublicInsights);
router.get(
  '/public/:slug',
  validation(InsightValidations.insightSlugSchema),
  InsightControllers.getPublicInsightBySlug,
);

router.get('/', auth('admin', 'editor'), InsightControllers.getInsights);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(InsightValidations.insightIdSchema),
  InsightControllers.getInsight,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(InsightValidations.createInsightValidationSchema),
  InsightControllers.createInsight,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(InsightValidations.updateInsightValidationSchema),
  InsightControllers.updateInsight,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(InsightValidations.insightIdSchema),
  InsightControllers.restoreInsight,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(InsightValidations.insightIdSchema),
  InsightControllers.deleteInsightPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(InsightValidations.insightIdSchema),
  InsightControllers.deleteInsight,
);

const insightRoutes = router;
export default insightRoutes;
