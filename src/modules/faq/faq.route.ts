import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FaqControllers from './faq.controller';
import * as FaqValidations from './faq.validator';

const router = express.Router();

router.get('/public', FaqControllers.getPublicFaqs);

router.get('/', auth('admin', 'editor'), FaqControllers.getFaqs);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(FaqValidations.faqIdSchema),
  FaqControllers.getFaq,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(FaqValidations.createFaqValidationSchema),
  FaqControllers.createFaq,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(FaqValidations.reorderFaqsValidationSchema),
  FaqControllers.reorderFaqs,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(FaqValidations.updateFaqValidationSchema),
  FaqControllers.updateFaq,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(FaqValidations.faqIdSchema),
  FaqControllers.deleteFaqPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(FaqValidations.faqIdSchema),
  FaqControllers.deleteFaq,
);

const faqRoutes = router;
export default faqRoutes;
