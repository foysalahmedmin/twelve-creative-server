import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import {
  authRateLimiter,
  forgetPasswordRateLimiter,
} from '../../middlewares/rate-limit.middleware';
import validation from '../../middlewares/validation.middleware';
import * as AuthControllers from './auth.controller';
import * as AuthValidations from './auth.validator';

const router = express.Router();

router.use(authRateLimiter);

router.post(
  '/signin',
  validation(AuthValidations.signinValidationSchema),
  AuthControllers.signin,
);

router.post(
  '/google-login',
  validation(AuthValidations.googleLoginValidationSchema),
  AuthControllers.googleLogin,
);

router.post(
  '/signup',
  file({
    name: 'image',
    folder: '/users',
    size: 5_000_000,
    maxCount: 1,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  }),
  validation(AuthValidations.signupValidationSchema),
  AuthControllers.signup,
);

router.post(
  '/refresh-token',
  validation(AuthValidations.refreshTokenValidationSchema),
  AuthControllers.refreshToken,
);

router.patch(
  '/change-password',
  auth('admin', 'editor'),
  validation(AuthValidations.changePasswordValidationSchema),
  AuthControllers.changePassword,
);

router.post(
  '/forget-password',
  forgetPasswordRateLimiter,
  validation(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.forgetPassword,
);

router.patch(
  '/reset-password',
  validation(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

router.post(
  '/email-verification-source',
  auth('admin', 'editor'),
  AuthControllers.emailVerificationSource,
);

router.post('/email-verification', AuthControllers.emailVerification);

router.post('/logout', AuthControllers.logout);

router.post(
  '/logout-all',
  auth('admin', 'editor'),
  AuthControllers.logoutAllSessions,
);

const authRoutes = router;

export default authRoutes;
