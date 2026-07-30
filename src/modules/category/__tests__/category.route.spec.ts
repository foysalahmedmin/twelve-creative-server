import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../category.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        (
          req as express.Request & { user: { _id: string; role: string } }
        ).user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@example.com',
        };
        next();
      },
  ),
);
jest.mock('../../../middlewares/file.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.files = {
          icon: [
            {
              path: 'uploads\\categories\\icons\\icon.png',
              filename: 'icon.png',
            },
          ],
        } as unknown as Express.Multer.File[];
        next();
      },
  ),
);
import categoryRoutes from '../category.route';
import * as CategoryService from '../category.service';

const CATEGORY_ID = '507f1f77bcf86cd799439011';
const category = {
  _id: CATEGORY_ID,
  name: 'Branding',
  status: 'active',
  tags: ['strategy'],
  is_featured: true,
};
const page = {
  data: [category],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/category', categoryRoutes);
  app.use(
    (
      err: { status?: number; message?: string; name?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(err.name === 'ZodError' ? 400 : err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    },
  );
  return app;
};

const request = supertest(buildApp());

describe('Category routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public category list', async () => {
    (CategoryService.getPublicCategories as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/category/public?page=1');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([category]);
    expect(response.body.meta).toEqual(page.meta);
    expect(CategoryService.getPublicCategories).toHaveBeenCalledWith(
      expect.objectContaining({ page: '1' }),
    );
  });

  it.each([
    'page=0',
    'page=10001',
    'limit=0',
    'limit=101',
    'search=',
    `search=${'a'.repeat(201)}`,
    'sort=status',
    'is_featured=1',
    'status=inactive',
    'is_deleted=true',
    'fields=%2Bis_deleted',
  ])('GET /public rejects unsafe query: %s', async (query) => {
    const response = await request.get(`/api/category/public?${query}`);

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(CategoryService.getPublicCategories).not.toHaveBeenCalled();
  });

  it('GET /public accepts bounded filters and sort fields', async () => {
    (CategoryService.getPublicCategories as jest.Mock).mockResolvedValue(page);

    const response = await request.get(
      '/api/category/public?page=2&limit=25&search=brand&sort=sequence,-name&is_featured=true&layout=default&tags=strategy',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(CategoryService.getPublicCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        page: '2',
        limit: '25',
        search: 'brand',
        sort: 'sequence,-name',
        is_featured: 'true',
        layout: 'default',
        tags: 'strategy',
      }),
    );
  });

  it('GET / returns the admin category list', async () => {
    (CategoryService.getCategories as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/category?filter=active');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([category]);
    expect(CategoryService.getCategories).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'active' }),
    );
  });

  it('GET /:id returns a category detail', async () => {
    (CategoryService.getCategory as jest.Mock).mockResolvedValue(category);

    const response = await request.get(`/api/category/${CATEGORY_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(category);
    expect(CategoryService.getCategory).toHaveBeenCalledWith(CATEGORY_ID);
  });

  it('POST / creates a category with a normalized uploaded icon path', async () => {
    (CategoryService.createCategory as jest.Mock).mockResolvedValue(category);
    const payload = { name: category.name, status: category.status };

    const response = await request.post('/api/category').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(category);
    expect(CategoryService.createCategory).toHaveBeenCalledWith({
      ...payload,
      icon: '/uploads/categories/icons/icon.png',
    });
  });

  it('POST /:id/restore restores a deleted category', async () => {
    (CategoryService.restoreCategory as jest.Mock).mockResolvedValue(category);

    const response = await request.post(`/api/category/${CATEGORY_ID}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(category);
    expect(CategoryService.restoreCategory).toHaveBeenCalledWith(CATEGORY_ID);
  });

  it('PATCH /:id updates a category and forwards the uploaded icon', async () => {
    const updated = { ...category, name: 'Updated category' };
    (CategoryService.updateCategory as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/category/${CATEGORY_ID}`)
      .send({ name: updated.name });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(CategoryService.updateCategory).toHaveBeenCalledWith(CATEGORY_ID, {
      name: updated.name,
      icon: '/uploads/categories/icons/icon.png',
    });
  });

  it('DELETE /:id/permanent permanently deletes a category', async () => {
    (CategoryService.deleteCategoryPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(
      `/api/category/${CATEGORY_ID}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(CategoryService.deleteCategoryPermanent).toHaveBeenCalledWith(
      CATEGORY_ID,
    );
  });

  it('DELETE /:id soft deletes a category', async () => {
    (CategoryService.deleteCategory as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/category/${CATEGORY_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(CategoryService.deleteCategory).toHaveBeenCalledWith(CATEGORY_ID);
  });

  it('forwards a not-found service error to the HTTP error handler', async () => {
    (CategoryService.getCategory as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Category not found',
    });

    const response = await request.get(`/api/category/${CATEGORY_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      success: false,
      message: 'Category not found',
    });
  });
});
