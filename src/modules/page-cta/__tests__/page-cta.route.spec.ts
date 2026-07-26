import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../page-cta.service');
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

import pageCtaRoutes from '../page-cta.route';
import * as PageCtaService from '../page-cta.service';

const app = express();
app.use(express.json());
app.use('/api/page-ctas', pageCtaRoutes);
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

const cta = {
  placement: 'home',
  industry: null,
  title: 'Build the structure',
  description: 'Start with clarity.',
  image: '/uploads/cta.jpg',
  primary_cta: { label: 'Start', href: '/contact' },
  is_active: true,
};

describe('Page CTA routes', () => {
  it('serves the resolved public CTA without authentication', async () => {
    (PageCtaService.getPublicPageCta as jest.Mock).mockResolvedValue(cta);
    const response = await request.get(
      '/api/page-ctas/public/industry-detail?industry_slug=hospitality',
    );
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(cta);
    expect(response.headers['x-test-auth-roles']).toBeUndefined();
    expect(PageCtaService.getPublicPageCta).toHaveBeenCalledWith(
      'industry-detail',
      'hospitality',
    );
  });

  it('normalizes the public Industry slug before resolving an override', async () => {
    (PageCtaService.getPublicPageCta as jest.Mock).mockResolvedValue(cta);

    const response = await request.get(
      '/api/page-ctas/public/industry-detail?industry_slug=%20Hospitality%20',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(PageCtaService.getPublicPageCta).toHaveBeenCalledWith(
      'industry-detail',
      'hospitality',
    );
  });

  it('protects admin listing and forwards typed filters', async () => {
    (PageCtaService.getPageCtas as jest.Mock).mockResolvedValue([cta]);
    const response = await request.get(
      '/api/page-ctas?placement=home&industry=507f1f77bcf86cd799439011',
    );
    expect(response.status).toBe(httpStatus.OK);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
    expect(PageCtaService.getPageCtas).toHaveBeenCalledWith({
      placement: 'home',
      industry: '507f1f77bcf86cd799439011',
    });
  });

  it('forwards the complete payload to the upsert service', async () => {
    (PageCtaService.upsertPageCta as jest.Mock).mockResolvedValue(cta);
    const response = await request.put('/api/page-ctas/upsert').send(cta);
    expect(response.status).toBe(httpStatus.OK);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
    expect(PageCtaService.upsertPageCta).toHaveBeenCalledWith(cta);
  });

  it('passes service failures to the application error handler', async () => {
    (PageCtaService.deletePageCta as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Page CTA not found',
    });
    const response = await request.delete(
      '/api/page-ctas/507f1f77bcf86cd799439011',
    );
    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Page CTA not found');
  });
});
