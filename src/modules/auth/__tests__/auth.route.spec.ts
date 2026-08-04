/**
 * auth.route.test.ts
 *
 * Integration tests for the Auth HTTP routes.
 * The service layer is fully mocked — no DB, Redis, or SMTP needed.
 * Auth, validation, rate-limiter, and file middlewares are all stubbed.
 */

import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

// ── Mock service BEFORE importing routes ─────────────────────────────────────
jest.mock('../auth.service');
jest.mock('../../system-log/system-log.model', () => ({
  SystemLog: { log: jest.fn() },
}));

// ── Stub rate limiter ─────────────────────────────────────────────────────────
jest.mock('../../../middlewares/rate-limit.middleware', () => ({
  authRateLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
  forgetPasswordRateLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

// ── Stub file middleware ───────────────────────────────────────────────────────
// Deliberately leaves req.files untouched (undefined) instead of setting {}:
// the real multer-based middleware only populates req.files for an actual
// multipart/form-data request, and the signup form this route serves sends
// plain JSON with no image field, so req.files is undefined in production.
jest.mock('../../../middlewares/file.middleware', () => {
  return jest.fn(
    () =>
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.set('x-test-file-middleware', 'ran');
        next();
      },
  );
});

// ── Stub auth middleware ───────────────────────────────────────────────────────
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn((..._roles: string[]) => {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.get('x-test-auth') === 'deny') {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'No token provided.',
        });
        return;
      }

      (req as express.Request & { user: unknown }).user = {
        _id: '507f1f77bcf86cd799439011',
        role: 'admin',
        name: 'John Doe',
        email: 'john@example.com',
      };
      next();
    };
  });
});

// ── Stub validation middleware ────────────────────────────────────────────────
jest.mock('../../../middlewares/validation.middleware', () => {
  return jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  );
});

import authRoutes from '../auth.route';
import * as AuthService from '../auth.service';

// ─── App Factory ──────────────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => {
    // Simulate cookie-parser so req.cookies is defined
    (_req as express.Request & { cookies: Record<string, string> }).cookies =
      {};
    next();
  });
  app.use('/api/auth', authRoutes);

  app.use(
    (
      err: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    },
  );

  return app;
};

const app = buildApp();
const request = supertest(app);

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockTokenResponse = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  info: {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'editor',
  },
};

// ─── POST /api/auth/signin ────────────────────────────────────────────────────

describe('POST /api/auth/signin', () => {
  it('should return 200 with tokens on valid credentials', async () => {
    (AuthService.signin as jest.Mock).mockResolvedValue(mockTokenResponse);

    const res = await request.post('/api/auth/signin').send({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mock_access_token');
    expect(AuthService.signin).toHaveBeenCalled();
  });

  it('should return the generic 401 response when credentials are invalid', async () => {
    (AuthService.signin as jest.Mock).mockRejectedValue({
      status: httpStatus.UNAUTHORIZED,
      message: 'Invalid email or password!',
    });

    const res = await request
      .post('/api/auth/signin')
      .send({ email: 'ghost@example.com', password: 'pass' });

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });

  it('should not distinguish a wrong password from an unknown email', async () => {
    (AuthService.signin as jest.Mock).mockRejectedValue({
      status: httpStatus.UNAUTHORIZED,
      message: 'Invalid email or password!',
    });

    const res = await request
      .post('/api/auth/signin')
      .send({ email: 'john@example.com', password: 'wrong' });

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('should return 200 and create a user for an authenticated admin', async () => {
    (AuthService.signup as jest.Mock).mockResolvedValue(mockTokenResponse);

    const res = await request.post('/api/auth/signup').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'editor',
    });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mock_access_token');
    expect(AuthService.signup).toHaveBeenCalled();
  });

  it('should reject an unauthenticated signup before creating a user', async () => {
    const res = await request
      .post('/api/auth/signup')
      .set('x-test-auth', 'deny')
      .send({
        name: 'Untrusted User',
        email: 'untrusted@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
    expect(res.headers['x-test-file-middleware']).toBeUndefined();
    expect(AuthService.signup).not.toHaveBeenCalled();
  });

  it('should return 409 when user already exists', async () => {
    (AuthService.signup as jest.Mock).mockRejectedValue({
      status: httpStatus.CONFLICT,
      message: 'User already exists!',
    });

    const res = await request.post('/api/auth/signup').send({
      name: 'John',
      email: 'existing@example.com',
      password: 'pass',
    });

    expect(res.status).toBe(httpStatus.CONFLICT);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/auth/refresh-token ─────────────────────────────────────────────

describe('POST /api/auth/refresh-token', () => {
  it('should return 200 with a new access token', async () => {
    (AuthService.refreshToken as jest.Mock).mockResolvedValue({
      access_token: 'new_access_token',
      info: mockTokenResponse.info,
    });

    const res = await request
      .post('/api/auth/refresh-token')
      .set('Cookie', 'refresh_token=mock_refresh_token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.token).toBe('new_access_token');
  });

  it('should return 403 when refresh token is invalid', async () => {
    (AuthService.refreshToken as jest.Mock).mockRejectedValue({
      status: httpStatus.FORBIDDEN,
      message: 'Password recently changed. Please login again.',
    });

    const res = await request
      .post('/api/auth/refresh-token')
      .set('Cookie', 'refresh_token=stale_token');

    expect(res.status).toBe(httpStatus.FORBIDDEN);
  });
});

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────

describe('PATCH /api/auth/change-password', () => {
  it('should return 200 on successful password change', async () => {
    (AuthService.changePassword as jest.Mock).mockResolvedValue({
      email: 'john@example.com',
    });

    const res = await request
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer mock_token')
      .send({ current_password: 'old_pass', new_password: 'new_pass' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });

  it('should return 403 when current password is wrong', async () => {
    (AuthService.changePassword as jest.Mock).mockRejectedValue({
      status: httpStatus.FORBIDDEN,
      message: 'Password do not matched!',
    });

    const res = await request
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer mock_token')
      .send({ current_password: 'wrong', new_password: 'new_pass' });

    expect(res.status).toBe(httpStatus.FORBIDDEN);
  });
});

// ─── POST /api/auth/forget-password ──────────────────────────────────────────

describe('POST /api/auth/forget-password', () => {
  it('should return 200 and send a reset email', async () => {
    (AuthService.forgetPassword as jest.Mock).mockResolvedValue(undefined);

    const res = await request
      .post('/api/auth/forget-password')
      .send({ email: 'john@example.com' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(AuthService.forgetPassword).toHaveBeenCalled();
  });

  it('should return the same 200 response when user is not found', async () => {
    (AuthService.forgetPassword as jest.Mock).mockResolvedValue(undefined);

    const res = await request
      .post('/api/auth/forget-password')
      .send({ email: 'ghost@example.com' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });
});

// ─── PATCH /api/auth/reset-password ──────────────────────────────────────────

describe('PATCH /api/auth/reset-password', () => {
  it('should return 200 on successful password reset', async () => {
    (AuthService.resetPassword as jest.Mock).mockResolvedValue({
      email: 'john@example.com',
    });

    const res = await request
      .patch('/api/auth/reset-password')
      .set('Authorization', 'valid_reset_token')
      .send({ password: 'new_password' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 on invalid token', async () => {
    (AuthService.resetPassword as jest.Mock).mockRejectedValue({
      status: httpStatus.UNAUTHORIZED,
      message:
        'You do not have the necessary permissions to access this resource.',
    });

    const res = await request
      .patch('/api/auth/reset-password')
      .set('Authorization', 'bad_token')
      .send({ password: 'pass' });

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

// ─── POST /api/auth/email-verification-source ────────────────────────────────

describe('POST /api/auth/email-verification-source', () => {
  it('should return 200 and trigger verification email', async () => {
    (AuthService.emailVerificationSource as jest.Mock).mockResolvedValue(
      undefined,
    );

    const res = await request
      .post('/api/auth/email-verification-source')
      .set('Authorization', 'Bearer mock_token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(AuthService.emailVerificationSource).toHaveBeenCalled();
  });
});

// ─── POST /api/auth/email-verification ───────────────────────────────────────

describe('POST /api/auth/email-verification', () => {
  it('should return 200 and mark email as verified', async () => {
    (AuthService.emailVerification as jest.Mock).mockResolvedValue({
      email: 'john@example.com',
      is_verified: true,
    });

    const res = await request
      .post('/api/auth/email-verification')
      .set('Authorization', 'valid_verify_token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(AuthService.emailVerification).toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    (AuthService.emailVerification as jest.Mock).mockRejectedValue({
      status: httpStatus.UNAUTHORIZED,
      message:
        'You do not have the necessary permissions to access this resource.',
    });

    const res = await request
      .post('/api/auth/email-verification')
      .set('Authorization', 'bad_token');

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

// ─── POST /api/auth/google-login ──────────────────────────────────────────────

describe('POST /api/auth/google-login', () => {
  it('should return 200 with tokens on valid Google token', async () => {
    (AuthService.googleLogin as jest.Mock).mockResolvedValue(mockTokenResponse);

    const res = await request
      .post('/api/auth/google-login')
      .send({ id_token: 'valid_google_id_token' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.token).toBe('mock_access_token');
    expect(AuthService.googleLogin).toHaveBeenCalledWith(
      'valid_google_id_token',
    );
  });

  it('should return 400 when google token is invalid', async () => {
    (AuthService.googleLogin as jest.Mock).mockRejectedValue({
      status: httpStatus.BAD_REQUEST,
      message: 'Invalid google token',
    });

    const res = await request
      .post('/api/auth/google-login')
      .send({ id_token: 'bad_token' });

    expect(res.status).toBe(httpStatus.BAD_REQUEST);
  });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('should revoke a body refresh token and clear the cookie', async () => {
    (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

    const res = await request
      .post('/api/auth/logout')
      .send({ refresh_token: 'refresh-token' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body).toMatchObject({ success: true, data: null });
    expect(res.headers['set-cookie']?.[0]).toContain('refresh_token=;');
    expect(AuthService.logout).toHaveBeenCalledWith('refresh-token');
  });

  it('should remain idempotent when no refresh token is provided', async () => {
    const res = await request.post('/api/auth/logout').send({});

    expect(res.status).toBe(httpStatus.OK);
    expect(AuthService.logout).not.toHaveBeenCalled();
  });
});

// ─── POST /api/auth/logout-all ───────────────────────────────────────────────

describe('POST /api/auth/logout-all', () => {
  it('should invalidate every session for the authenticated user', async () => {
    (AuthService.logoutAllSessions as jest.Mock).mockResolvedValue(undefined);

    const res = await request.post('/api/auth/logout-all');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body).toMatchObject({ success: true, data: null });
    expect(AuthService.logoutAllSessions).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should pass session invalidation failures to the error handler', async () => {
    (AuthService.logoutAllSessions as jest.Mock).mockRejectedValue({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Could not invalidate sessions',
    });

    const res = await request.post('/api/auth/logout-all');

    expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(res.body.success).toBe(false);
  });
});
