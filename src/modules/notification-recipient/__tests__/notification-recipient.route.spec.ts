/**
 * notification-recipient.route.spec.ts
 *
 * Integration tests for the NotificationRecipient HTTP routes.
 */

import express from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import supertest from 'supertest';

// ── Mock service and middlewares BEFORE importing routes ─────────────────────
jest.mock('../notification-recipient.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.user = { _id: 'user123', role: 'admin' };
    next();
  });
});
jest.mock('../../../middlewares/validation.middleware', () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

import NotificationRecipientRoutes from '../notification-recipient.route';
import * as NotificationRecipientService from '../notification-recipient.service';

// ─── App Factory ──────────────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/notification-recipient', NotificationRecipientRoutes);

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

describe('NotificationRecipient Routes', () => {
  const mockId = new mongoose.Types.ObjectId().toString();
  const mockNotificationId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notification-recipient', () => {
    it('should return 200 with all recipients', async () => {
      (
        NotificationRecipientService.getNotificationRecipients as jest.Mock
      ).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      });

      const res = await request.get('/api/notification-recipient');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.getNotificationRecipients,
      ).toHaveBeenCalled();
    });
  });

  describe('GET /api/notification-recipient/self', () => {
    it('should return 200 with self recipients', async () => {
      (
        NotificationRecipientService.getSelfNotificationRecipients as jest.Mock
      ).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      });

      const res = await request.get('/api/notification-recipient/self');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.getSelfNotificationRecipients,
      ).toHaveBeenCalled();
    });
  });

  describe('GET /api/notification-recipient/:id', () => {
    it('should return 200 with recipient details', async () => {
      (
        NotificationRecipientService.getNotificationRecipient as jest.Mock
      ).mockResolvedValue({
        _id: mockId,
      });

      const res = await request.get(`/api/notification-recipient/${mockId}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.getNotificationRecipient,
      ).toHaveBeenCalledWith(mockId);
    });
  });

  describe('POST /api/notification-recipient', () => {
    it('should return 200 when recipient created', async () => {
      (
        NotificationRecipientService.createNotificationRecipient as jest.Mock
      ).mockResolvedValue({
        _id: mockId,
        notification: mockNotificationId,
      });

      const res = await request.post('/api/notification-recipient').send({
        notification: mockNotificationId,
        recipient: mockId,
        metadata: {},
      });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.createNotificationRecipient,
      ).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/notification-recipient/:id', () => {
    it('should return 200 when recipient updated', async () => {
      (
        NotificationRecipientService.updateNotificationRecipient as jest.Mock
      ).mockResolvedValue({
        _id: mockId,
        is_read: true,
      });

      const res = await request
        .patch(`/api/notification-recipient/${mockId}`)
        .send({ is_read: true });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.updateNotificationRecipient,
      ).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/notification-recipient/:id', () => {
    it('should return 200 when recipient deleted', async () => {
      (
        NotificationRecipientService.deleteNotificationRecipient as jest.Mock
      ).mockResolvedValue(undefined);

      const res = await request.delete(`/api/notification-recipient/${mockId}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(
        NotificationRecipientService.deleteNotificationRecipient,
      ).toHaveBeenCalledWith(mockId);
    });
  });
});
