import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../about-page.service');
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

import { ABOUT_PAGE_SEED } from '../../../scripts/seeds/about-page.seed';
import aboutPageRoutes from '../about-page.route';
import * as AboutPageService from '../about-page.service';

const app = express();
app.use(express.json());
app.use('/api/about-page', aboutPageRoutes);
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

describe('About page routes', () => {
  it('serves the public singleton without authentication', async () => {
    (AboutPageService.getPublicAboutPage as jest.Mock).mockResolvedValue(
      ABOUT_PAGE_SEED,
    );
    const response = await request.get('/api/about-page/public');
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toMatchObject({
      founder: ABOUT_PAGE_SEED.founder,
    });
    expect(response.headers['x-test-auth-roles']).toBeUndefined();
  });

  it('protects the admin singleton endpoint', async () => {
    (AboutPageService.getAboutPage as jest.Mock).mockResolvedValue(
      ABOUT_PAGE_SEED,
    );
    const response = await request.get('/api/about-page');
    expect(response.status).toBe(httpStatus.OK);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
  });

  it('forwards the complete editor payload', async () => {
    (AboutPageService.updateAboutPage as jest.Mock).mockResolvedValue(
      ABOUT_PAGE_SEED,
    );
    const response = await request
      .patch('/api/about-page')
      .send(ABOUT_PAGE_SEED);
    expect(response.status).toBe(httpStatus.OK);
    expect(AboutPageService.updateAboutPage).toHaveBeenCalledWith(
      expect.objectContaining({ founder: ABOUT_PAGE_SEED.founder }),
    );
  });

  it('passes service failures to the error handler', async () => {
    (AboutPageService.updateAboutPage as jest.Mock).mockRejectedValue({
      status: httpStatus.BAD_REQUEST,
      message: 'Story card ids must be unique',
    });
    const response = await request
      .patch('/api/about-page')
      .send(ABOUT_PAGE_SEED);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });
});
