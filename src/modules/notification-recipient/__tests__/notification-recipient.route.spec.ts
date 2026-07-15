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
jest.mock('../../../config/socket', () => ({ emitToUser: jest.fn() }));
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
import { emitToUser } from '../../../config/socket';
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

  describe('self, bulk, permanent-delete, and restore routes', () => {
    const selfUser = expect.objectContaining({ _id: 'user123' });

    it('GET /:id/self returns only the authenticated user recipient', async () => {
      (
        NotificationRecipientService.getSelfNotificationRecipient as jest.Mock
      ).mockResolvedValue({ _id: mockId, recipient: 'user123' });

      const res = await request.get(
        `/api/notification-recipient/${mockId}/self`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data._id).toBe(mockId);
      expect(
        NotificationRecipientService.getSelfNotificationRecipient,
      ).toHaveBeenCalledWith(selfUser, mockId);
    });

    it('PATCH /read-all/self marks every self notification as read and emits an event', async () => {
      (
        NotificationRecipientService.readAllNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 3 });

      const res = await request.patch(
        '/api/notification-recipient/read-all/self',
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ count: 3 });
      expect(
        NotificationRecipientService.readAllNotificationRecipients,
      ).toHaveBeenCalledWith(selfUser);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'notification-recipients-bulk-updated',
        { count: 3, action: 'read-all' },
      );
    });

    it('PATCH /bulk/self uses the user-scoped bulk service', async () => {
      (
        NotificationRecipientService.updateSelfNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: ['unowned'] });

      const res = await request
        .patch('/api/notification-recipient/bulk/self')
        .send({ ids: [mockId, 'unowned'], is_read: true });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({
        count: 1,
        not_found_ids: ['unowned'],
      });
      expect(
        NotificationRecipientService.updateSelfNotificationRecipients,
      ).toHaveBeenCalledWith(selfUser, [mockId, 'unowned'], { is_read: true });
      expect(
        NotificationRecipientService.updateNotificationRecipients,
      ).not.toHaveBeenCalled();
    });

    it('PATCH /:id/self updates one self-owned recipient and emits an event', async () => {
      const updated = { _id: mockId, is_read: true, read_at: '2026-07-15' };
      (
        NotificationRecipientService.updateSelfNotificationRecipient as jest.Mock
      ).mockResolvedValue(updated);

      const res = await request
        .patch(`/api/notification-recipient/${mockId}/self`)
        .send({ is_read: true });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(updated);
      expect(
        NotificationRecipientService.updateSelfNotificationRecipient,
      ).toHaveBeenCalledWith(selfUser, mockId, { is_read: true });
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'notification-recipient-updated',
        expect.objectContaining({ _id: mockId, is_read: true }),
      );
    });

    it('PATCH /bulk performs an admin bulk update', async () => {
      (
        NotificationRecipientService.updateNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: [] });

      const res = await request
        .patch('/api/notification-recipient/bulk')
        .send({ ids: [mockId], is_read: true });

      expect(res.status).toBe(httpStatus.OK);
      expect(
        NotificationRecipientService.updateNotificationRecipients,
      ).toHaveBeenCalledWith([mockId], { is_read: true });
    });

    it('DELETE /bulk/self soft-deletes only self-owned recipients', async () => {
      (
        NotificationRecipientService.deleteSelfNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: ['unowned'] });

      const res = await request
        .delete('/api/notification-recipient/bulk/self')
        .send({ ids: [mockId, 'unowned'] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: ['unowned'] });
      expect(
        NotificationRecipientService.deleteSelfNotificationRecipients,
      ).toHaveBeenCalledWith(selfUser, [mockId, 'unowned']);
    });

    it('DELETE /bulk/permanent permanently deletes recipients', async () => {
      (
        NotificationRecipientService.deleteNotificationRecipientsPermanent as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: ['missing'] });

      const res = await request
        .delete('/api/notification-recipient/bulk/permanent')
        .send({ ids: [mockId, 'missing'] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: ['missing'] });
      expect(
        NotificationRecipientService.deleteNotificationRecipientsPermanent,
      ).toHaveBeenCalledWith([mockId, 'missing']);
    });

    it('DELETE /bulk soft-deletes admin-selected recipients', async () => {
      (
        NotificationRecipientService.deleteNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: [] });

      const res = await request
        .delete('/api/notification-recipient/bulk')
        .send({ ids: [mockId] });

      expect(res.status).toBe(httpStatus.OK);
      expect(
        NotificationRecipientService.deleteNotificationRecipients,
      ).toHaveBeenCalledWith([mockId]);
    });

    it('DELETE /:id/self soft-deletes one self-owned recipient and emits an event', async () => {
      (
        NotificationRecipientService.deleteSelfNotificationRecipient as jest.Mock
      ).mockResolvedValue(undefined);

      const res = await request.delete(
        `/api/notification-recipient/${mockId}/self`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(
        NotificationRecipientService.deleteSelfNotificationRecipient,
      ).toHaveBeenCalledWith(selfUser, mockId);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'notification-recipient-deleted',
        { _id: mockId },
      );
    });

    it('DELETE /:id/permanent permanently deletes one recipient', async () => {
      (
        NotificationRecipientService.deleteNotificationRecipientPermanent as jest.Mock
      ).mockResolvedValue(undefined);

      const res = await request.delete(
        `/api/notification-recipient/${mockId}/permanent`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(
        NotificationRecipientService.deleteNotificationRecipientPermanent,
      ).toHaveBeenCalledWith(mockId);
    });

    it('POST /bulk/restore/self restores only self-owned recipients', async () => {
      (
        NotificationRecipientService.restoreSelfNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: ['unowned'] });

      const res = await request
        .post('/api/notification-recipient/bulk/restore/self')
        .send({ ids: [mockId, 'unowned'] });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual({ not_found_ids: ['unowned'] });
      expect(
        NotificationRecipientService.restoreSelfNotificationRecipients,
      ).toHaveBeenCalledWith(selfUser, [mockId, 'unowned']);
    });

    it('POST /bulk/restore restores admin-selected recipients', async () => {
      (
        NotificationRecipientService.restoreNotificationRecipients as jest.Mock
      ).mockResolvedValue({ count: 1, not_found_ids: [] });

      const res = await request
        .post('/api/notification-recipient/bulk/restore')
        .send({ ids: [mockId] });

      expect(res.status).toBe(httpStatus.OK);
      expect(
        NotificationRecipientService.restoreNotificationRecipients,
      ).toHaveBeenCalledWith([mockId]);
    });

    it('POST /:id/restore/self restores one self-owned recipient', async () => {
      const restored = { _id: mockId, recipient: 'user123' };
      (
        NotificationRecipientService.restoreSelfNotificationRecipient as jest.Mock
      ).mockResolvedValue(restored);

      const res = await request.post(
        `/api/notification-recipient/${mockId}/restore/self`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(restored);
      expect(
        NotificationRecipientService.restoreSelfNotificationRecipient,
      ).toHaveBeenCalledWith(selfUser, mockId);
    });

    it('POST /:id/restore restores one recipient for admin', async () => {
      const restored = { _id: mockId };
      (
        NotificationRecipientService.restoreNotificationRecipient as jest.Mock
      ).mockResolvedValue(restored);

      const res = await request.post(
        `/api/notification-recipient/${mockId}/restore`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(restored);
      expect(
        NotificationRecipientService.restoreNotificationRecipient,
      ).toHaveBeenCalledWith(mockId);
    });

    it('passes service errors to the route error handler', async () => {
      (
        NotificationRecipientService.getSelfNotificationRecipient as jest.Mock
      ).mockRejectedValue({
        status: httpStatus.NOT_FOUND,
        message: 'Notification recipient not found',
      });

      const res = await request.get(
        `/api/notification-recipient/${mockId}/self`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Notification recipient not found',
      });
    });
  });
});
