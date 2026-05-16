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
});
