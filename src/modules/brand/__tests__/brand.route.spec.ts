import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../brand.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@twelvecreative.co',
        };
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

import brandRoutes from '../brand.route';
import * as BrandService from '../brand.service';

const app = express();
app.use(express.json());
app.use('/api/brand', brandRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  },
);

const request = supertest(app);
const BRAND_ID = '507f1f77bcf86cd799439011';
const brand = {
  _id: BRAND_ID,
  name: 'Acme',
  logo: 'https://cdn.example.com/acme.svg',
  href: 'https://acme.example.com',
  order: 1,
  is_active: true,
};

describe('Brand routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public brand list', async () => {
    (BrandService.getPublicBrands as jest.Mock).mockResolvedValue({
      data: [brand],
    });

    const response = await request.get('/api/brand/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Brands retrieved successfully',
      data: [brand],
    });
    expect(BrandService.getPublicBrands).toHaveBeenCalledWith();
  });

  it('GET / returns paginated brands and forwards query parameters', async () => {
    (BrandService.getBrands as jest.Mock).mockResolvedValue({
      data: [brand],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get(
      '/api/brand?filter=active&search=acme&page=1',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([brand]);
    expect(response.body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1,
    });
    expect(BrandService.getBrands).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'active',
        search: 'acme',
        page: '1',
      }),
    );
  });

  it('GET /:id returns the requested brand', async () => {
    (BrandService.getBrand as jest.Mock).mockResolvedValue(brand);

    const response = await request.get(`/api/brand/${BRAND_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(brand);
    expect(response.body.message).toBe('Brand retrieved successfully');
    expect(BrandService.getBrand).toHaveBeenCalledWith(BRAND_ID);
  });

  it('POST / creates a brand from the request body', async () => {
    const payload = {
      name: brand.name,
      logo: brand.logo,
      href: brand.href,
      order: brand.order,
      is_active: brand.is_active,
    };
    (BrandService.createBrand as jest.Mock).mockResolvedValue(brand);

    const response = await request.post('/api/brand').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(brand);
    expect(response.body.message).toBe('Brand created successfully');
    expect(BrandService.createBrand).toHaveBeenCalledWith(payload);
  });

  it('POST /reorder forwards the items and returns a null response body', async () => {
    const items = [
      { _id: BRAND_ID, order: 2 },
      { _id: '507f1f77bcf86cd799439012', order: 1 },
    ];
    (BrandService.reorderBrands as jest.Mock).mockResolvedValue(undefined);

    const response = await request.post('/api/brand/reorder').send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('Brands reordered successfully');
    expect(BrandService.reorderBrands).toHaveBeenCalledWith(items);
  });

  it('PATCH /:id updates the requested brand', async () => {
    const payload = { name: 'Acme Studio', is_active: false };
    const updated = { ...brand, ...payload };
    (BrandService.updateBrand as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/brand/${BRAND_ID}`)
      .send(payload);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(response.body.message).toBe('Brand updated successfully');
    expect(BrandService.updateBrand).toHaveBeenCalledWith(BRAND_ID, payload);
  });

  it('DELETE /:id/permanent permanently deletes the requested brand', async () => {
    (BrandService.deleteBrandPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/brand/${BRAND_ID}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('Brand permanently deleted');
    expect(BrandService.deleteBrandPermanent).toHaveBeenCalledWith(BRAND_ID);
  });

  it('DELETE /:id soft deletes the requested brand', async () => {
    (BrandService.deleteBrand as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/brand/${BRAND_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('Brand deleted successfully');
    expect(BrandService.deleteBrand).toHaveBeenCalledWith(BRAND_ID);
  });

  it('passes a service not-found error to the route error handler', async () => {
    (BrandService.getBrand as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Brand not found',
    });

    const response = await request.get(`/api/brand/${BRAND_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      success: false,
      message: 'Brand not found',
    });
  });

  it('passes an unexpected reorder failure to the route error handler', async () => {
    (BrandService.reorderBrands as jest.Mock).mockRejectedValue(
      new Error('Reorder failed'),
    );

    const response = await request
      .post('/api/brand/reorder')
      .send({ items: [{ _id: BRAND_ID, order: 1 }] });

    expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      success: false,
      message: 'Reorder failed',
    });
  });
});
