import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../featured-project.service');
jest.mock('../../../middlewares/auth.middleware', () =>
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

import featuredProjectRoutes from '../featured-project.route';
import * as FeaturedProjectService from '../featured-project.service';

const app = express();
app.use(express.json());
app.use('/api/featured-project', featuredProjectRoutes);
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

const id = '507f1f77bcf86cd799439012';
const industryId = '507f1f77bcf86cd799439011';
const project = {
  _id: id,
  title: 'Hotel film',
  industry: { _id: industryId, name: 'Hospitality', slug: 'hospitality' },
  aspect: 'reel',
  thumbnail: '/hotel.jpg',
  video: { source: 'url', value: '/hotel.mp4' },
  order: 0,
  is_active: true,
};

describe('Featured project routes', () => {
  it('GET /public forwards the optional industry slug', async () => {
    (
      FeaturedProjectService.getPublicFeaturedProjects as jest.Mock
    ).mockResolvedValue({ data: [project] });

    const response = await request.get(
      '/api/featured-project/public?industry_slug=Hospitality',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([project]);
    expect(
      FeaturedProjectService.getPublicFeaturedProjects,
    ).toHaveBeenCalledWith({
      industry_slug: 'Hospitality',
    });
  });

  it('GET / returns the paginated admin collection', async () => {
    (FeaturedProjectService.getFeaturedProjects as jest.Mock).mockResolvedValue(
      {
        data: [project],
        meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
      },
    );

    const response = await request.get(
      `/api/featured-project?industry=${industryId}`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([project]);
    expect(response.body.meta.total).toBe(1);
    expect(FeaturedProjectService.getFeaturedProjects).toHaveBeenCalledWith(
      expect.objectContaining({ industry: industryId }),
    );
  });

  it('GET /:id returns one project', async () => {
    (FeaturedProjectService.getFeaturedProject as jest.Mock).mockResolvedValue(
      project,
    );

    const response = await request.get(`/api/featured-project/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(project);
    expect(FeaturedProjectService.getFeaturedProject).toHaveBeenCalledWith(id);
  });

  it('POST / creates a project', async () => {
    (
      FeaturedProjectService.createFeaturedProject as jest.Mock
    ).mockResolvedValue(project);
    const payload = {
      title: project.title,
      industry: industryId,
      aspect: project.aspect,
      thumbnail: project.thumbnail,
      video: project.video,
    };

    const response = await request.post('/api/featured-project').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(project);
    expect(FeaturedProjectService.createFeaturedProject).toHaveBeenCalledWith(
      payload,
    );
  });

  it('POST /reorder forwards reorder items', async () => {
    const items = [{ _id: id, order: 2 }];
    (
      FeaturedProjectService.reorderFeaturedProjects as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request
      .post('/api/featured-project/reorder')
      .send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(FeaturedProjectService.reorderFeaturedProjects).toHaveBeenCalledWith(
      items,
    );
  });

  it('POST /:id/restore restores a project', async () => {
    (
      FeaturedProjectService.restoreFeaturedProject as jest.Mock
    ).mockResolvedValue(project);

    const response = await request.post(`/api/featured-project/${id}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(project);
    expect(FeaturedProjectService.restoreFeaturedProject).toHaveBeenCalledWith(
      id,
    );
  });

  it('PATCH /:id updates a project', async () => {
    const updated = { ...project, title: 'Updated film' };
    (
      FeaturedProjectService.updateFeaturedProject as jest.Mock
    ).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/featured-project/${id}`)
      .send({ title: 'Updated film' });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.title).toBe('Updated film');
    expect(FeaturedProjectService.updateFeaturedProject).toHaveBeenCalledWith(
      id,
      {
        title: 'Updated film',
      },
    );
  });

  it('DELETE /:id/permanent permanently deletes a project', async () => {
    (
      FeaturedProjectService.deleteFeaturedProjectPermanent as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(
      `/api/featured-project/${id}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(
      FeaturedProjectService.deleteFeaturedProjectPermanent,
    ).toHaveBeenCalledWith(id);
  });

  it('DELETE /:id soft-deletes a project', async () => {
    (
      FeaturedProjectService.deleteFeaturedProject as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(`/api/featured-project/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(FeaturedProjectService.deleteFeaturedProject).toHaveBeenCalledWith(
      id,
    );
  });

  it('passes service errors to the route error handler', async () => {
    (FeaturedProjectService.getFeaturedProject as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Featured project not found',
    });

    const response = await request.get(`/api/featured-project/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Featured project not found',
    });
  });
});
