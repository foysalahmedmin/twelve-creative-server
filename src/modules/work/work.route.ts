import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as WorkControllers from './work.controller';
import * as WorkValidations from './work.validator';

const router = express.Router();

// Public — list + slug detail
router.get('/public', WorkControllers.getPublicWorks);
router.get(
  '/public/:slug',
  validation(WorkValidations.workSlugSchema),
  WorkControllers.getPublicWorkBySlug,
);

// Admin
router.get('/', auth('admin', 'editor'), WorkControllers.getWorks);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(WorkValidations.workIdSchema),
  WorkControllers.getWork,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(WorkValidations.createWorkValidationSchema),
  WorkControllers.createWork,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(WorkValidations.reorderWorksValidationSchema),
  WorkControllers.reorderWorks,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(WorkValidations.updateWorkValidationSchema),
  WorkControllers.updateWork,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(WorkValidations.workIdSchema),
  WorkControllers.deleteWorkPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(WorkValidations.workIdSchema),
  WorkControllers.deleteWork,
);

const workRoutes = router;
export default workRoutes;
