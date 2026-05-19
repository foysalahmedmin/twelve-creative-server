import express from 'express';
import rateLimit from 'express-rate-limit';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ContactMessageControllers from './contact-message.controller';
import * as ContactMessageValidations from './contact-message.validator';

const router = express.Router();

const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages from this IP. Please try again later.',
  },
});

// ─── Public ──────────────────────────────────────────────────────────────────
router.post(
  '/public',
  publicSubmitLimiter,
  validation(ContactMessageValidations.createContactMessageValidationSchema),
  ContactMessageControllers.submitContactMessage,
);

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get(
  '/unread-count',
  auth('admin', 'editor'),
  ContactMessageControllers.getUnreadCount,
);

router.get(
  '/',
  auth('admin', 'editor'),
  ContactMessageControllers.getContactMessages,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(ContactMessageValidations.contactMessageIdSchema),
  ContactMessageControllers.getContactMessage,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(ContactMessageValidations.updateContactMessageValidationSchema),
  ContactMessageControllers.updateContactMessage,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(ContactMessageValidations.contactMessageIdSchema),
  ContactMessageControllers.deleteContactMessagePermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(ContactMessageValidations.contactMessageIdSchema),
  ContactMessageControllers.deleteContactMessage,
);

const contactMessageRoutes = router;
export default contactMessageRoutes;
