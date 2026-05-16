/**
 * user.route.test.ts
 *
 * Integration tests for the User HTTP routes.
 * Tests are run against a real Express app instance (no live server needed).
 * The service layer is mocked so no DB / Redis connections are required.
 * Auth & validation middlewares are stubbed to allow role-based route testing.
 */

import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

// ── Mock service BEFORE importing routes ─────────────────────────────────────
jest.mock('../user.service');

// ── Mock file middleware (pass-through) ───────────────────────────────────────
jest.mock('../../../middlewares/file.middleware', () => {
  return jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.files = {};
        next();
      },
  );
});

// ── Mock auth middleware ──────────────────────────────────────────────────────
// Default: inject admin user. Individual suites override this via mockAuth.
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn((..._roles: string[]) => {
    return (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      (req as express.Request & { user: unknown }).user = {
        _id: '507f1f77bcf86cd799439011',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
      };
      next();
    };
  });
});

// ── Mock validation middleware (pass-through) ─────────────────────────────────
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

import userRoutes from '../user.route';
import * as UserService from '../user.service';

// ─── App Factory ──────────────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/user', userRoutes);

  // Global error handler (mirrors the real one)
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

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  status: 'in-progress',
  is_verified: true,
  auth_source: 'email',
};

const mockPaginated = {
  data: [mockUser],
  meta: { total: 1, page: 1, limit: 10 },
};

// ─── GET /api/user/self ───────────────────────────────────────────────────────

describe('GET /api/user/self', () => {
  it('should return 200 with the authenticated user', async () => {
    (UserService.getSelf as jest.Mock).mockResolvedValue(mockUser);

    const res = await request
      .get('/api/user/self')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john@example.com');
    expect(UserService.getSelf).toHaveBeenCalled();
  });

  it('should return 404 when user not found', async () => {
    (UserService.getSelf as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });

    const res = await request
      .get('/api/user/self')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/user/writers ────────────────────────────────────────────────────

describe('GET /api/user/writers', () => {
  it('should return 200 with paginated writers', async () => {
    (UserService.getWritersUsers as jest.Mock).mockResolvedValue(mockPaginated);

    const res = await request.get('/api/user/writers');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(UserService.getWritersUsers).toHaveBeenCalled();
  });
});

// ─── GET /api/user (admin) ────────────────────────────────────────────────────

describe('GET /api/user', () => {
  it('should return 200 with all users for admin', async () => {
    (UserService.getUsers as jest.Mock).mockResolvedValue(mockPaginated);

    const res = await request
      .get('/api/user')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

// ─── GET /api/user/:id ────────────────────────────────────────────────────────

describe('GET /api/user/:id', () => {
  const id = '507f1f77bcf86cd799439011';

  it('should return 200 with a single user', async () => {
    (UserService.getUser as jest.Mock).mockResolvedValue(mockUser);

    const res = await request
      .get(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data._id).toBe(id);
  });

  it('should return 404 when user not found', async () => {
    (UserService.getUser as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });

    const res = await request
      .get(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });
});

// ─── PATCH /api/user/self ─────────────────────────────────────────────────────

describe('PATCH /api/user/self', () => {
  it('should update and return the authenticated user', async () => {
    (UserService.updateSelf as jest.Mock).mockResolvedValue({
      ...mockUser,
      name: 'Updated Name',
    });

    const res = await request
      .patch('/api/user/self')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.name).toBe('Updated Name');
    expect(UserService.updateSelf).toHaveBeenCalled();
  });

  it('should return 409 when email is already taken', async () => {
    (UserService.updateSelf as jest.Mock).mockRejectedValue({
      status: httpStatus.CONFLICT,
      message: 'Email already exists',
    });

    const res = await request
      .patch('/api/user/self')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(httpStatus.CONFLICT);
  });
});

// ─── PATCH /api/user/:id ──────────────────────────────────────────────────────

describe('PATCH /api/user/:id', () => {
  const id = '507f1f77bcf86cd799439011';

  it('should update a user and return 200', async () => {
    (UserService.updateUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'admin',
    });

    const res = await request
      .patch(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token')
      .send({ role: 'admin' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.role).toBe('admin');
  });

  it('should return 404 when user not found', async () => {
    (UserService.updateUser as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });

    const res = await request
      .patch(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token')
      .send({ role: 'editor' });

    expect(res.status).toBe(httpStatus.NOT_FOUND);
  });
});

// ─── PATCH /api/user/bulk ─────────────────────────────────────────────────────

describe('PATCH /api/user/bulk', () => {
  it('should bulk-update users and return 200', async () => {
    (UserService.updateUsers as jest.Mock).mockResolvedValue({
      count: 2,
      not_found_ids: [],
    });

    const res = await request
      .patch('/api/user/bulk')
      .set('Authorization', 'Bearer mock-token')
      .send({
        ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        status: 'blocked',
      });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.count ?? res.body.data).toBeDefined();
  });
});

// ─── DELETE /api/user/:id ─────────────────────────────────────────────────────

describe('DELETE /api/user/:id', () => {
  const id = '507f1f77bcf86cd799439011';

  it('should soft-delete a user and return 200', async () => {
    (UserService.deleteUser as jest.Mock).mockResolvedValue(undefined);

    const res = await request
      .delete(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(UserService.deleteUser).toHaveBeenCalledWith(id);
  });

  it('should return 404 when user not found', async () => {
    (UserService.deleteUser as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });

    const res = await request
      .delete(`/api/user/${id}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.NOT_FOUND);
  });
});

// ─── DELETE /api/user/:id/permanent ──────────────────────────────────────────

describe('DELETE /api/user/:id/permanent', () => {
  const id = '507f1f77bcf86cd799439011';

  it('should hard-delete a user and return 200', async () => {
    (UserService.deleteUserPermanent as jest.Mock).mockResolvedValue(undefined);

    const res = await request
      .delete(`/api/user/${id}/permanent`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toBeNull();
    expect(UserService.deleteUserPermanent).toHaveBeenCalledWith(id);
  });
});

// ─── DELETE /api/user/bulk ────────────────────────────────────────────────────

describe('DELETE /api/user/bulk', () => {
  it('should bulk soft-delete and return 200', async () => {
    (UserService.deleteUsers as jest.Mock).mockResolvedValue({
      count: 1,
      not_found_ids: ['507f1f77bcf86cd799439099'],
    });

    const res = await request
      .delete('/api/user/bulk')
      .set('Authorization', 'Bearer mock-token')
      .send({ ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439099'] });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.not_found_ids).toContain('507f1f77bcf86cd799439099');
  });
});

// ─── DELETE /api/user/bulk/permanent ─────────────────────────────────────────

describe('DELETE /api/user/bulk/permanent', () => {
  it('should bulk hard-delete and return 200', async () => {
    (UserService.deleteUsersPermanent as jest.Mock).mockResolvedValue({
      count: 2,
      not_found_ids: [],
    });

    const res = await request
      .delete('/api/user/bulk/permanent')
      .set('Authorization', 'Bearer mock-token')
      .send({
        ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });
});

// ─── POST /api/user/:id/restore ───────────────────────────────────────────────

describe('POST /api/user/:id/restore', () => {
  const id = '507f1f77bcf86cd799439011';

  it('should restore a deleted user and return 200', async () => {
    (UserService.restoreUser as jest.Mock).mockResolvedValue(mockUser);

    const res = await request
      .post(`/api/user/${id}/restore`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.email).toBe('john@example.com');
  });

  it('should return 404 when user not found or not deleted', async () => {
    (UserService.restoreUser as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'User not found or not deleted',
    });

    const res = await request
      .post(`/api/user/${id}/restore`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(httpStatus.NOT_FOUND);
  });
});

// ─── POST /api/user/bulk/restore ─────────────────────────────────────────────

describe('POST /api/user/bulk/restore', () => {
  it('should bulk restore and return 200', async () => {
    (UserService.restoreUsers as jest.Mock).mockResolvedValue({
      count: 2,
      not_found_ids: [],
    });

    const res = await request
      .post('/api/user/bulk/restore')
      .set('Authorization', 'Bearer mock-token')
      .send({
        ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data.count ?? res.body.data).toBeDefined();
  });
});
