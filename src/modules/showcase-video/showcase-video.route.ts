import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ShowcaseVideoControllers from './showcase-video.controller';
import * as ShowcaseVideoValidations from './showcase-video.validator';

const router = express.Router();

// ─── Public ──────────────────────────────────────────────────────────────────
router.get(
  '/public',
  validation(ShowcaseVideoValidations.publicShowcaseVideosQuerySchema),
  ShowcaseVideoControllers.getPublicShowcaseVideos,
);

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get(
  '/',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.adminShowcaseVideosQuerySchema),
  ShowcaseVideoControllers.getShowcaseVideos,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.showcaseVideoIdSchema),
  ShowcaseVideoControllers.getShowcaseVideo,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.createShowcaseVideoValidationSchema),
  ShowcaseVideoControllers.createShowcaseVideo,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.reorderShowcaseVideosValidationSchema),
  ShowcaseVideoControllers.reorderShowcaseVideos,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(ShowcaseVideoValidations.showcaseVideoIdSchema),
  ShowcaseVideoControllers.restoreShowcaseVideo,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.updateShowcaseVideoValidationSchema),
  ShowcaseVideoControllers.updateShowcaseVideo,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(ShowcaseVideoValidations.showcaseVideoIdSchema),
  ShowcaseVideoControllers.deleteShowcaseVideoPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(ShowcaseVideoValidations.showcaseVideoIdSchema),
  ShowcaseVideoControllers.deleteShowcaseVideo,
);

const showcaseVideoRoutes = router;
export default showcaseVideoRoutes;
