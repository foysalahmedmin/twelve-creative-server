import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../shared-section.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    (...roles: string[]) =>
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.setHeader('x-test-auth-roles', roles.join(','));
        next();
      },
  ),
);
jest.mock('../../../middlewares/validation.middleware', () =>
  jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  ),
);

import sharedSectionRoutes from '../shared-section.route';
import * as SharedSectionService from '../shared-section.service';

const app = express();
app.use(express.json());
app.use('/api/shared-sections', sharedSectionRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? 500)
      .json({ success: false, message: error.message });
  },
);
const request = supertest(app);

const section = {
  key: 'faq',
  label: 'FAQ',
  title: 'Frequently Asked Questions',
  description: 'Everything you need to know.',
  content: {},
  is_active: true,
};

describe('Shared section routes', () => {
  it('serves one public section without authentication', async () => {
    (
      SharedSectionService.getPublicSharedSection as jest.Mock
    ).mockResolvedValue(section);
    const response = await request.get('/api/shared-sections/public/faq');
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(section);
    expect(response.headers['x-test-auth-roles']).toBeUndefined();
    expect(SharedSectionService.getPublicSharedSection).toHaveBeenCalledWith(
      'faq',
    );
  });

  it('protects the admin collection endpoint', async () => {
    (SharedSectionService.getSharedSections as jest.Mock).mockResolvedValue([
      section,
    ]);
    const response = await request.get('/api/shared-sections');
    expect(response.status).toBe(httpStatus.OK);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
  });

  it('forwards route key and complete body on upsert', async () => {
    (SharedSectionService.updateSharedSection as jest.Mock).mockResolvedValue(
      section,
    );
    const response = await request
      .put('/api/shared-sections/faq')
      .send(section);
    expect(response.status).toBe(httpStatus.OK);
    expect(SharedSectionService.updateSharedSection).toHaveBeenCalledWith(
      'faq',
      section,
    );
  });

  it('passes service failures to the error handler', async () => {
    (SharedSectionService.updateSharedSection as jest.Mock).mockRejectedValue({
      status: httpStatus.BAD_REQUEST,
      message: 'Route key must match the shared section payload key',
    });
    const response = await request
      .put('/api/shared-sections/faq')
      .send(section);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });
});
