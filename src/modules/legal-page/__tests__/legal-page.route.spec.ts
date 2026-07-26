import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../legal-page.service');
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

import { LEGAL_PAGE_SEED } from '../../../scripts/seeds/legal-page.seed';
import legalPageRoutes from '../legal-page.route';
import * as LegalPageService from '../legal-page.service';

const app = express();
app.use(express.json());
app.use('/api/legal-pages', legalPageRoutes);
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
const page = LEGAL_PAGE_SEED[0];

describe('Legal page routes', () => {
  it('serves a published public page without authentication', async () => {
    (LegalPageService.getPublicLegalPage as jest.Mock).mockResolvedValue(page);
    const response = await request.get(
      '/api/legal-pages/public/privacy-policy',
    );
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toMatchObject({ slug: 'privacy-policy' });
    expect(response.headers['x-test-auth-roles']).toBeUndefined();
  });

  it('protects the admin list', async () => {
    (LegalPageService.getLegalPages as jest.Mock).mockResolvedValue(
      LEGAL_PAGE_SEED,
    );
    const response = await request.get('/api/legal-pages');
    expect(response.status).toBe(httpStatus.OK);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
  });

  it('forwards slug and full payload on upsert', async () => {
    (LegalPageService.upsertLegalPage as jest.Mock).mockResolvedValue(page);
    const response = await request
      .put('/api/legal-pages/privacy-policy')
      .send(page);
    expect(response.status).toBe(httpStatus.OK);
    expect(LegalPageService.upsertLegalPage).toHaveBeenCalledWith(
      'privacy-policy',
      page,
    );
  });

  it('passes publishing failures to the error handler', async () => {
    (LegalPageService.upsertLegalPage as jest.Mock).mockRejectedValue({
      status: httpStatus.BAD_REQUEST,
      message: 'An effective date is required before publishing',
    });
    const response = await request
      .put('/api/legal-pages/privacy-policy')
      .send(page);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });
});
