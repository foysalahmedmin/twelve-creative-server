import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeaturedProjectControllers from './featured-project.controller';
import * as FeaturedProjectValidations from './featured-project.validator';

const router = express.Router();

router.get(
  '/public',
  validation(FeaturedProjectValidations.publicFeaturedProjectsQuerySchema),
  FeaturedProjectControllers.getPublicFeaturedProjects,
);

router.get(
  '/',
  auth('admin', 'editor'),
  validation(FeaturedProjectValidations.adminFeaturedProjectsQuerySchema),
  FeaturedProjectControllers.getFeaturedProjects,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(FeaturedProjectValidations.featuredProjectIdSchema),
  FeaturedProjectControllers.getFeaturedProject,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(FeaturedProjectValidations.createFeaturedProjectValidationSchema),
  FeaturedProjectControllers.createFeaturedProject,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(
    FeaturedProjectValidations.reorderFeaturedProjectsValidationSchema,
  ),
  FeaturedProjectControllers.reorderFeaturedProjects,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(FeaturedProjectValidations.featuredProjectIdSchema),
  FeaturedProjectControllers.restoreFeaturedProject,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(FeaturedProjectValidations.updateFeaturedProjectValidationSchema),
  FeaturedProjectControllers.updateFeaturedProject,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(FeaturedProjectValidations.featuredProjectIdSchema),
  FeaturedProjectControllers.deleteFeaturedProjectPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(FeaturedProjectValidations.featuredProjectIdSchema),
  FeaturedProjectControllers.deleteFeaturedProject,
);

const featuredProjectRoutes = router;
export default featuredProjectRoutes;
