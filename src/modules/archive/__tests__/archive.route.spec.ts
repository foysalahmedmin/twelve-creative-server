import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../archive.service');
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

import archiveRoutes from '../archive.route';
import * as ArchiveService from '../archive.service';

const POST_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439099';
const post = {
  _id: POST_ID,
  title: 'A useful post',
  content: 'Post content',
  type: 'video',
  status: 'active',
};
const page = {
  data: [post],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/archive', archiveRoutes);
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

const request = supertest(buildApp());

describe('Archive routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public post list', async () => {
    (ArchiveService.getPublicPosts as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/archive/public?page=1');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([post]);
    expect(response.body.meta).toEqual(page.meta);
    expect(ArchiveService.getPublicPosts).toHaveBeenCalledWith(
      expect.objectContaining({ page: '1' }),
    );
  });

  it('GET / returns the admin post list', async () => {
    (ArchiveService.getPosts as jest.Mock).mockResolvedValue(page);

    const response = await request.get('/api/archive?filter=draft');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([post]);
    expect(ArchiveService.getPosts).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'draft' }),
    );
  });

  it('GET /:id/public returns a public post detail', async () => {
    (ArchiveService.getPost as jest.Mock).mockResolvedValue(post);

    const response = await request.get(`/api/archive/${POST_ID}/public`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(post);
    expect(ArchiveService.getPost).toHaveBeenCalledWith(POST_ID);
  });

  it('GET /:id returns an admin post detail', async () => {
    (ArchiveService.getPost as jest.Mock).mockResolvedValue(post);

    const response = await request.get(`/api/archive/${POST_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(post);
    expect(ArchiveService.getPost).toHaveBeenCalledWith(POST_ID);
  });

  it('POST / creates a post for the authenticated user', async () => {
    (ArchiveService.createPost as jest.Mock).mockResolvedValue(post);
    const payload = {
      title: post.title,
      content: post.content,
      type: post.type,
    };

    const response = await request.post('/api/archive').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(post);
    expect(ArchiveService.createPost).toHaveBeenCalledWith({
      ...payload,
      user: USER_ID,
    });
  });

  it('POST /:id/restore restores a deleted post', async () => {
    (ArchiveService.restorePost as jest.Mock).mockResolvedValue(post);

    const response = await request.post(`/api/archive/${POST_ID}/restore`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(post);
    expect(ArchiveService.restorePost).toHaveBeenCalledWith(POST_ID);
  });

  it('PATCH /:id updates a post', async () => {
    const updated = { ...post, title: 'Updated post' };
    (ArchiveService.updatePost as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/archive/${POST_ID}`)
      .send({ title: updated.title });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(ArchiveService.updatePost).toHaveBeenCalledWith(POST_ID, {
      title: updated.title,
    });
  });

  it('DELETE /:id/permanent permanently deletes a post', async () => {
    (ArchiveService.deletePostPermanent as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/archive/${POST_ID}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ArchiveService.deletePostPermanent).toHaveBeenCalledWith(POST_ID);
  });

  it('DELETE /:id soft deletes a post', async () => {
    (ArchiveService.deletePost as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/archive/${POST_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ArchiveService.deletePost).toHaveBeenCalledWith(POST_ID);
  });

  it('forwards a not-found service error to the HTTP error handler', async () => {
    (ArchiveService.getPost as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Post not found',
    });

    const response = await request.get(`/api/archive/${POST_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      success: false,
      message: 'Post not found',
    });
  });
});
