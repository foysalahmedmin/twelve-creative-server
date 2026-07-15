import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../showcase-video.service');
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

import showcaseVideoRoutes from '../showcase-video.route';
import * as ShowcaseVideoService from '../showcase-video.service';

const app = express();
app.use(express.json());
app.use('/api/showcase-video', showcaseVideoRoutes);
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
const video = {
  _id: id,
  industry: { _id: industryId, name: 'Hospitality', slug: 'hospitality' },
  video: { source: 'url', value: '/showcase.mp4' },
  thumbnail: '/showcase.jpg',
  alt: 'Hospitality showcase',
  aspect: 'reel',
  order: 0,
  is_active: true,
};

describe('Showcase video routes', () => {
  it('GET /public forwards valid aspect and industry filters', async () => {
    (
      ShowcaseVideoService.getPublicShowcaseVideos as jest.Mock
    ).mockResolvedValue({ data: [video] });

    const response = await request.get(
      '/api/showcase-video/public?aspect=reel&industry_slug=Hospitality',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([video]);
    expect(ShowcaseVideoService.getPublicShowcaseVideos).toHaveBeenCalledWith({
      aspect: 'reel',
      industry_slug: 'Hospitality',
    });
  });

  it('GET /public discards an unsupported aspect before calling the service', async () => {
    (
      ShowcaseVideoService.getPublicShowcaseVideos as jest.Mock
    ).mockResolvedValue({ data: [] });

    const response = await request.get(
      '/api/showcase-video/public?aspect=square',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(ShowcaseVideoService.getPublicShowcaseVideos).toHaveBeenCalledWith({
      aspect: undefined,
      industry_slug: undefined,
    });
  });

  it('GET / returns paginated admin videos', async () => {
    (ShowcaseVideoService.getShowcaseVideos as jest.Mock).mockResolvedValue({
      data: [video],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get(
      `/api/showcase-video?industry=${industryId}&aspect=reel`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([video]);
    expect(response.body.meta.total).toBe(1);
    expect(ShowcaseVideoService.getShowcaseVideos).toHaveBeenCalledWith(
      expect.objectContaining({ industry: industryId, aspect: 'reel' }),
    );
  });

  it('GET /:id returns one showcase video', async () => {
    (ShowcaseVideoService.getShowcaseVideo as jest.Mock).mockResolvedValue(
      video,
    );

    const response = await request.get(`/api/showcase-video/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(video);
    expect(ShowcaseVideoService.getShowcaseVideo).toHaveBeenCalledWith(id);
  });

  it('POST / creates a showcase video', async () => {
    (ShowcaseVideoService.createShowcaseVideo as jest.Mock).mockResolvedValue(
      video,
    );
    const payload = {
      industry: industryId,
      video: video.video,
      thumbnail: video.thumbnail,
      alt: video.alt,
      aspect: video.aspect,
    };

    const response = await request.post('/api/showcase-video').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(video);
    expect(ShowcaseVideoService.createShowcaseVideo).toHaveBeenCalledWith(
      payload,
    );
  });

  it('POST /reorder forwards reorder items', async () => {
    const items = [{ _id: id, order: 2 }];
    (ShowcaseVideoService.reorderShowcaseVideos as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request
      .post('/api/showcase-video/reorder')
      .send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ShowcaseVideoService.reorderShowcaseVideos).toHaveBeenCalledWith(
      items,
    );
  });

  it('POST /:id/restore restores a showcase video', async () => {
    (ShowcaseVideoService.restoreShowcaseVideo as jest.Mock).mockResolvedValue(
      video,
    );

    const response = await request.post(`/api/showcase-video/${id}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(video);
    expect(ShowcaseVideoService.restoreShowcaseVideo).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates a showcase video', async () => {
    const updated = { ...video, alt: 'Updated alt' };
    (ShowcaseVideoService.updateShowcaseVideo as jest.Mock).mockResolvedValue(
      updated,
    );

    const response = await request
      .patch(`/api/showcase-video/${id}`)
      .send({ alt: updated.alt });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.alt).toBe(updated.alt);
    expect(ShowcaseVideoService.updateShowcaseVideo).toHaveBeenCalledWith(id, {
      alt: updated.alt,
    });
  });

  it('DELETE /:id/permanent permanently deletes a showcase video', async () => {
    (
      ShowcaseVideoService.deleteShowcaseVideoPermanent as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(
      `/api/showcase-video/${id}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(
      ShowcaseVideoService.deleteShowcaseVideoPermanent,
    ).toHaveBeenCalledWith(id);
  });

  it('DELETE /:id soft-deletes a showcase video', async () => {
    (ShowcaseVideoService.deleteShowcaseVideo as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/showcase-video/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ShowcaseVideoService.deleteShowcaseVideo).toHaveBeenCalledWith(id);
  });

  it('passes service errors to the route error handler', async () => {
    (ShowcaseVideoService.getShowcaseVideo as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Showcase video not found',
    });

    const response = await request.get(`/api/showcase-video/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Showcase video not found',
    });
  });
});
