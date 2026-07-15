/**
 * file.route.test.ts
 *
 * Integration tests for the Unified File HTTP routes.
 */

import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

// ── Mock service and middlewares BEFORE importing routes ─────────────────────
jest.mock('../file.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.user = {
      _id: 'user123',
      role: 'admin',
      name: 'Admin',
      email: 'admin@test.com',
    };
    next();
  });
});
jest.mock('../../../middlewares/file.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.files = { file: [{ path: 'uploads/test.jpg', filename: 'test.jpg' }] };
    next();
  });
});
jest.mock('../../../middlewares/storage.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.storages = [
      { filename: 'cloud.jpg', publicUrl: 'http://cloud.com/cloud.jpg' },
    ];
    next();
  });
});
jest.mock('../../../middlewares/validation.middleware', () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

import fileRoutes from '../file.route';
import * as FileService from '../file.service';

// ─── App Factory ──────────────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/file', fileRoutes);

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  });

  return app;
};

const app = buildApp();
const request = supertest(app);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/file (Local Upload)', () => {
  it('should return 201 when local upload succeeds', async () => {
    (FileService.createLocalFile as jest.Mock).mockResolvedValue({
      _id: '1',
      filename: 'test.jpg',
    });

    const res = await request.post('/api/file');

    expect(res.status).toBe(httpStatus.CREATED);
    expect(res.body.message).toContain('local storage');
    expect(FileService.createLocalFile).toHaveBeenCalled();
  });
});

describe('POST /api/file/cloud (Cloud Upload)', () => {
  it('should return 201 when cloud upload succeeds', async () => {
    (FileService.createCloudFiles as jest.Mock).mockResolvedValue([
      { _id: '2', filename: 'cloud.jpg' },
    ]);

    const res = await request.post('/api/file/cloud');

    expect(res.status).toBe(httpStatus.CREATED);
    expect(res.body.message).toContain('cloud storage');
    expect(FileService.createCloudFiles).toHaveBeenCalled();
  });
});

describe('GET /api/file', () => {
  it('should return 200 with files list', async () => {
    (FileService.getFiles as jest.Mock).mockResolvedValue({
      data: [],
      meta: {},
    });

    const res = await request.get('/api/file');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/file/:id', () => {
  it('should return 200 on soft delete', async () => {
    (FileService.deleteFile as jest.Mock).mockResolvedValue(undefined);

    const res = await request.delete('/api/file/507f1f77bcf86cd799439011');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(FileService.deleteFile).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });
});

describe('Remaining file routes', () => {
  const id = '507f1f77bcf86cd799439011';
  const file = { _id: id, filename: 'test.jpg', status: 'active' };

  it('GET /self returns files owned by the authenticated user', async () => {
    (FileService.getSelfFiles as jest.Mock).mockResolvedValue({
      data: [file],
      meta: { total: 1, page: 1, limit: 10 },
    });

    const res = await request.get('/api/file/self?type=image');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual([file]);
    expect(FileService.getSelfFiles).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'user123' }),
      expect.objectContaining({ type: 'image' }),
    );
  });

  it('GET /:id returns a single file', async () => {
    (FileService.getFile as jest.Mock).mockResolvedValue(file);

    const res = await request.get(`/api/file/${id}`);

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual(file);
    expect(FileService.getFile).toHaveBeenCalledWith(id);
  });

  it('GET /:id passes a missing-file error to the error handler', async () => {
    (FileService.getFile as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'File not found',
    });

    const res = await request.get(`/api/file/${id}`);

    expect(res.status).toBe(httpStatus.NOT_FOUND);
    expect(res.body).toMatchObject({
      success: false,
      message: 'File not found',
    });
  });

  it('PATCH /bulk separates ids from the update payload', async () => {
    (FileService.updateFiles as jest.Mock).mockResolvedValue({
      count: 1,
      not_found_ids: ['missing'],
    });

    const res = await request.patch('/api/file/bulk').send({
      ids: [id, 'missing'],
      status: 'inactive',
    });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(FileService.updateFiles).toHaveBeenCalledWith([id, 'missing'], {
      status: 'inactive',
    });
  });

  it('PATCH /:id updates one file', async () => {
    const updated = { ...file, name: 'Updated' };
    (FileService.updateFile as jest.Mock).mockResolvedValue(updated);

    const res = await request
      .patch(`/api/file/${id}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual(updated);
    expect(FileService.updateFile).toHaveBeenCalledWith(id, {
      name: 'Updated',
    });
  });

  it('DELETE /bulk/permanent permanently deletes a set of files', async () => {
    (FileService.deleteFilesPermanent as jest.Mock).mockResolvedValue({
      count: 1,
      not_found_ids: ['missing'],
    });

    const res = await request
      .delete('/api/file/bulk/permanent')
      .send({ ids: [id, 'missing'] });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual({ not_found_ids: ['missing'] });
    expect(FileService.deleteFilesPermanent).toHaveBeenCalledWith([
      id,
      'missing',
    ]);
  });

  it('DELETE /bulk soft-deletes a set of files', async () => {
    (FileService.deleteFiles as jest.Mock).mockResolvedValue({
      count: 1,
      not_found_ids: [],
    });

    const res = await request.delete('/api/file/bulk').send({ ids: [id] });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual({ not_found_ids: [] });
    expect(FileService.deleteFiles).toHaveBeenCalledWith([id]);
  });

  it('DELETE /:id/permanent permanently deletes one file', async () => {
    (FileService.deleteFilePermanent as jest.Mock).mockResolvedValue(undefined);

    const res = await request.delete(`/api/file/${id}/permanent`);

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toBeNull();
    expect(FileService.deleteFilePermanent).toHaveBeenCalledWith(id);
  });

  it('POST /bulk/restore restores a set of files', async () => {
    (FileService.restoreFiles as jest.Mock).mockResolvedValue({
      count: 1,
      not_found_ids: ['missing'],
    });

    const res = await request
      .post('/api/file/bulk/restore')
      .send({ ids: [id, 'missing'] });

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual({ not_found_ids: ['missing'] });
    expect(FileService.restoreFiles).toHaveBeenCalledWith([id, 'missing']);
  });

  it('POST /:id/restore restores one file', async () => {
    (FileService.restoreFile as jest.Mock).mockResolvedValue(file);

    const res = await request.post(`/api/file/${id}/restore`);

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.data).toEqual(file);
    expect(FileService.restoreFile).toHaveBeenCalledWith(id);
  });
});
