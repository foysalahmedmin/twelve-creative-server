import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../industry.service');
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

import industryRoutes from '../industry.route';
import * as IndustryService from '../industry.service';

const app = express();
app.use(express.json());
app.use('/api/industry', industryRoutes);
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

const id = '507f1f77bcf86cd799439011';
const reelThumbnail =
  'https://images.example.com/hospitality-reel-thumbnail.jpg';
const reelVideo = {
  source: 'url',
  value: 'https://videos.example.com/hospitality-reel.mp4',
};
const industry = {
  _id: id,
  name: 'Hospitality',
  slug: 'hospitality',
  reel_thumbnail: reelThumbnail,
  reel_video: reelVideo,
  order: 0,
  is_active: true,
};

describe('Industry routes', () => {
  it('GET /public returns active industries', async () => {
    (IndustryService.getPublicIndustries as jest.Mock).mockResolvedValue({
      data: [industry],
    });

    const response = await request.get('/api/industry/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([industry]);
    expect(IndustryService.getPublicIndustries).toHaveBeenCalledWith();
  });

  it('GET /options returns compact industry options', async () => {
    const options = [{ _id: id, name: 'Hospitality', slug: 'hospitality' }];
    (IndustryService.getIndustryOptions as jest.Mock).mockResolvedValue(
      options,
    );

    const response = await request.get('/api/industry/options');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(options);
    expect(IndustryService.getIndustryOptions).toHaveBeenCalledWith();
  });

  it('GET / returns paginated industries', async () => {
    (IndustryService.getIndustries as jest.Mock).mockResolvedValue({
      data: [industry],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get('/api/industry?search=hospitality');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([industry]);
    expect(response.body.meta.total).toBe(1);
    expect(IndustryService.getIndustries).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'hospitality' }),
    );
  });

  it('GET /:id returns one industry', async () => {
    (IndustryService.getIndustry as jest.Mock).mockResolvedValue(industry);

    const response = await request.get(`/api/industry/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(industry);
    expect(IndustryService.getIndustry).toHaveBeenCalledWith(id);
  });

  it('POST / creates an industry', async () => {
    (IndustryService.createIndustry as jest.Mock).mockResolvedValue(industry);
    const payload = {
      name: 'Hospitality',
      slug: 'hospitality',
      reel_thumbnail: reelThumbnail,
      reel_video: reelVideo,
      is_active: true,
    };

    const response = await request.post('/api/industry').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(industry);
    expect(IndustryService.createIndustry).toHaveBeenCalledWith(payload);
  });

  it('POST /reorder forwards reorder items', async () => {
    const items = [{ _id: id, order: 3 }];
    (IndustryService.reorderIndustries as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request
      .post('/api/industry/reorder')
      .send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(IndustryService.reorderIndustries).toHaveBeenCalledWith(items);
  });

  it('POST /:id/restore restores an industry', async () => {
    (IndustryService.restoreIndustry as jest.Mock).mockResolvedValue(industry);

    const response = await request.post(`/api/industry/${id}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(industry);
    expect(IndustryService.restoreIndustry).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates an industry', async () => {
    const updated = { ...industry, name: 'Luxury Hospitality' };
    (IndustryService.updateIndustry as jest.Mock).mockResolvedValue(updated);

    const response = await request.patch(`/api/industry/${id}`).send({
      name: updated.name,
      reel_thumbnail: reelThumbnail,
      reel_video: reelVideo,
    });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.name).toBe(updated.name);
    expect(IndustryService.updateIndustry).toHaveBeenCalledWith(id, {
      name: updated.name,
      reel_thumbnail: reelThumbnail,
      reel_video: reelVideo,
    });
  });

  it('PATCH /:id forwards null reel media so admins can clear it', async () => {
    const updated = {
      ...industry,
      reel_thumbnail: null,
      reel_video: null,
    };
    (IndustryService.updateIndustry as jest.Mock).mockResolvedValue(updated);

    const response = await request.patch(`/api/industry/${id}`).send({
      reel_thumbnail: null,
      reel_video: null,
    });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toMatchObject({
      reel_thumbnail: null,
      reel_video: null,
    });
    expect(IndustryService.updateIndustry).toHaveBeenCalledWith(id, {
      reel_thumbnail: null,
      reel_video: null,
    });
  });

  it('DELETE /:id/permanent permanently deletes an industry', async () => {
    (IndustryService.deleteIndustryPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/industry/${id}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(IndustryService.deleteIndustryPermanent).toHaveBeenCalledWith(id);
  });

  it('DELETE /:id soft-deletes an industry', async () => {
    (IndustryService.deleteIndustry as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/industry/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(IndustryService.deleteIndustry).toHaveBeenCalledWith(id);
  });

  it('passes service errors to the route error handler', async () => {
    (IndustryService.deleteIndustry as jest.Mock).mockRejectedValue({
      status: httpStatus.CONFLICT,
      message: 'Industry is referenced',
    });

    const response = await request.delete(`/api/industry/${id}`);

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Industry is referenced',
    });
  });
});
