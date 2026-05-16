import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config/env';

export const rateLimiter = rateLimit;

const skipServerRequests = (req: Request): boolean => {
  const serverApiKey = req.headers['x-server-api-key'];
  return !!(
    serverApiKey &&
    serverApiKey === (process.env.SERVER_API_KEY || config.server_api_key)
  );
};

// Global rate limiter for all API requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipServerRequests,
  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
  validate: { trustProxy: false },
});

// Stricter rate limiter for authentication routes (login, register, forgot password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipServerRequests,
  message: {
    success: false,
    message:
      'Too many authentication attempts, please try again after 15 minutes',
  },
  validate: { trustProxy: false },
});

// Very strict limiter for forget-password to prevent email enumeration/abuse
export const forgetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipServerRequests,
  message: {
    success: false,
    message:
      'Too many password reset requests from this IP, please try again after 15 minutes',
  },
  validate: { trustProxy: false },
});
