/**
 * notification.route.spec.ts
 *
 * Integration tests for the Notification HTTP routes.
 */

import express from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import supertest from 'supertest';

// ── Mock service and middlewares BEFORE importing routes ─────────────────────
jest.mock('../notification.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.user = { _id: 'user123', role: 'admin' };
    next();
  });
});
jest.mock('../../../middlewares/validation.middleware', () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

import notificationRoutes from '../notification.route';
import * as NotificationService from '../notification.service';

// ─── App Factory ──────────────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/notification', notificationRoutes);

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

describe('Notification Routes', () => {
  const mockId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notification', () => {
    it('should return 200 with notifications list', async () => {
      (NotificationService.getNotifications as jest.Mock).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      });

      const res = await request.get('/api/notification');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(NotificationService.getNotifications).toHaveBeenCalled();
    });
  });

  describe('GET /api/notification/:id', () => {
    it('should return 200 with notification details', async () => {
      (NotificationService.getNotification as jest.Mock).mockResolvedValue({
        _id: mockId,
        title: 'Test Notification',
      });

      const res = await request.get(`/api/notification/${mockId}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(NotificationService.getNotification).toHaveBeenCalledWith(mockId);
    });
  });

  describe('POST /api/notification', () => {
    it('should return 200 when notification created', async () => {
      (NotificationService.createNotification as jest.Mock).mockResolvedValue({
        _id: mockId,
        title: 'New Notification',
      });

      const res = await request.post('/api/notification').send({
        title: 'New Notification',
        message: 'Test',
        type: 'news-request',
        channels: ['web'],
        sender: mockId,
      });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(NotificationService.createNotification).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/notification/:id', () => {
    it('should return 200 when notification updated', async () => {
      (NotificationService.updateNotification as jest.Mock).mockResolvedValue({
        _id: mockId,
        title: 'Updated Notification',
      });

      const res = await request
        .patch(`/api/notification/${mockId}`)
        .send({ title: 'Updated Notification' });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(NotificationService.updateNotification).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/notification/:id', () => {
    it('should return 200 when notification deleted', async () => {
      (NotificationService.deleteNotification as jest.Mock).mockResolvedValue(
        undefined,
      );

      const res = await request.delete(`/api/notification/${mockId}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(NotificationService.deleteNotification).toHaveBeenCalledWith(
        mockId,
      );
    });
  });

  describe('bulk, permanent-delete, and restore routes', () => {
    it('PATCH /bulk separates ids from the status payload', async () => {
      (NotificationService.updateNotifications as jest.Mock).mockResolvedValue({
        count: 1,
        not_found_ids: ['missing'],
      });

      const res = await request.patch('/api/notification/bulk').send({
        ids: [mockId, 'missing'],
        status: 'inactive',
      });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ count: 1, not_found_ids: ['missing'] });
      expect(NotificationService.updateNotifications).toHaveBeenCalledWith(
        [mockId, 'missing'],
        { status: 'inactive' },
      );
    });

    it('DELETE /bulk/permanent permanently deletes notifications', async () => {
      (
        NotificationService.deleteNotificationsPermanent as jest.Mock
      ).mockResolvedValue({
        count: 1,
        not_found_ids: ['missing'],
      });

      const res = await request
        .delete('/api/notification/bulk/permanent')
        .send({ ids: [mockId, 'missing'] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: ['missing'] });
      expect(
        NotificationService.deleteNotificationsPermanent,
      ).toHaveBeenCalledWith([mockId, 'missing']);
    });

    it('DELETE /bulk soft-deletes notifications', async () => {
      (NotificationService.deleteNotifications as jest.Mock).mockResolvedValue({
        count: 1,
        not_found_ids: [],
      });

      const res = await request
        .delete('/api/notification/bulk')
        .send({ ids: [mockId] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: [] });
      expect(NotificationService.deleteNotifications).toHaveBeenCalledWith([
        mockId,
      ]);
    });

    it('DELETE /:id/permanent permanently deletes one notification', async () => {
      (
        NotificationService.deleteNotificationPermanent as jest.Mock
      ).mockResolvedValue(undefined);

      const res = await request.delete(`/api/notification/${mockId}/permanent`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toBeNull();
      expect(
        NotificationService.deleteNotificationPermanent,
      ).toHaveBeenCalledWith(mockId);
    });

    it('POST /bulk/restore restores notifications', async () => {
      (NotificationService.restoreNotifications as jest.Mock).mockResolvedValue(
        {
          count: 1,
          not_found_ids: ['missing'],
        },
      );

      const res = await request
        .post('/api/notification/bulk/restore')
        .send({ ids: [mockId, 'missing'] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: ['missing'] });
      expect(NotificationService.restoreNotifications).toHaveBeenCalledWith([
        mockId,
        'missing',
      ]);
    });

    it('POST /:id/restore restores one notification', async () => {
      const restored = { _id: mockId, title: 'Restored notification' };
      (NotificationService.restoreNotification as jest.Mock).mockResolvedValue(
        restored,
      );

      const res = await request.post(`/api/notification/${mockId}/restore`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(restored);
      expect(NotificationService.restoreNotification).toHaveBeenCalledWith(
        mockId,
      );
    });

    it('passes service errors to the route error handler', async () => {
      (NotificationService.getNotification as jest.Mock).mockRejectedValue({
        status: httpStatus.NOT_FOUND,
        message: 'Notification not found',
      });

      const res = await request.get(`/api/notification/${mockId}`);

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Notification not found',
      });
    });
  });
});
