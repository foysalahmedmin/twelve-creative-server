import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ProcessSectionControllers from './process-section.controller';
import { updateProcessSectionValidationSchema } from './process-section.validator';

const router = express.Router();

router.get('/public', ProcessSectionControllers.getPublicProcessSection);

router.get(
  '/',
  auth('admin', 'editor'),
  ProcessSectionControllers.getProcessSection,
);

router.patch(
  '/',
  auth('admin', 'editor'),
  validation(updateProcessSectionValidationSchema),
  ProcessSectionControllers.updateProcessSection,
);

const processSectionRoutes = router;
export default processSectionRoutes;
