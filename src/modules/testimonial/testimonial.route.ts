import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TestimonialControllers from './testimonial.controller';
import * as TestimonialValidations from './testimonial.validator';

const router = express.Router();

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/public', TestimonialControllers.getPublicTestimonials);

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get(
  '/',
  auth('admin', 'editor'),
  TestimonialControllers.getTestimonials,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(TestimonialValidations.testimonialIdSchema),
  TestimonialControllers.getTestimonial,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(TestimonialValidations.createTestimonialValidationSchema),
  TestimonialControllers.createTestimonial,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(TestimonialValidations.reorderTestimonialsValidationSchema),
  TestimonialControllers.reorderTestimonials,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(TestimonialValidations.testimonialIdSchema),
  TestimonialControllers.restoreTestimonial,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(TestimonialValidations.updateTestimonialValidationSchema),
  TestimonialControllers.updateTestimonial,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(TestimonialValidations.testimonialIdSchema),
  TestimonialControllers.deleteTestimonialPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(TestimonialValidations.testimonialIdSchema),
  TestimonialControllers.deleteTestimonial,
);

const testimonialRoutes = router;
export default testimonialRoutes;
