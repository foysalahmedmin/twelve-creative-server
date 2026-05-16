import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../../builder/app-error';
import * as NotificationService from '../notification.service';
import { TNotification } from '../notification.type';

// Mock models used directly in the service
jest.mock('../notification.model', () => ({
  Notification: {
    create: jest.fn(),
    findById: jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock('../../user-profile/user-profile.model', () => ({
  UserProfile: {
    findOne: jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  },
}));
jest.mock('../../notification-recipient/notification-recipient.model', () => ({
  NotificationRecipient: {
    insertMany: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));
jest.mock('../../news/news.model', () => ({
  News: { findById: jest.fn() },
}));
jest.mock('../../user/user.model', () => ({
  User: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('../../../config/socket', () => ({
  emitToUser: jest.fn(),
}));
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(),
  invalidateCacheByPattern: jest.fn(),
  withCache: jest.fn((_key: string, _ttl: number, cb: () => Promise<unknown>) =>
    cb(),
  ),
}));
// Mock AppQueryFind used in getNotifications
jest.mock('../../../builder/app-query-find', () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    fields: jest.fn().mockReturnThis(),
    tap: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10 },
    }),
  }));
});

import { Notification } from '../notification.model';

describe('Notification Service', () => {
  const mockId = new mongoose.Types.ObjectId().toString();
  const mockSenderId = new mongoose.Types.ObjectId();

  const mockNotification: TNotification = {
    title: 'Test Notification',
    message: 'Test message',
    type: 'news-request',
    priority: 'medium',
    channels: ['web'],
    sender: mockSenderId,
    is_deleted: false,
  };

  const mockNotificationDoc = {
    ...mockNotification,
    _id: new mongoose.Types.ObjectId(),
    toObject: () => mockNotification,
    softDelete: jest.fn().mockResolvedValue(undefined),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      (Notification.create as jest.Mock).mockResolvedValue(mockNotificationDoc);

      const result =
        await NotificationService.createNotification(mockNotification);

      expect(Notification.create).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotification', () => {
    it('should return a notification by id', async () => {
      (Notification.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockNotificationDoc),
      });

      const result = await NotificationService.getNotification(mockId);

      expect(Notification.findById).toHaveBeenCalledWith(mockId);
      expect(result).toBeDefined();
    });

    it('should throw error if notification not found', async () => {
      (Notification.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(NotificationService.getNotification(mockId)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification not found'),
      );
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const result = await NotificationService.getNotifications({});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('updateNotification', () => {
    it('should update a notification', async () => {
      (Notification.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockNotification),
      });
      (Notification.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockNotificationDoc,
      );

      const result = await NotificationService.updateNotification(mockId, {
        title: 'Updated Title',
      });

      expect(result).toBeDefined();
    });

    it('should throw error if notification not found on update', async () => {
      (Notification.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        NotificationService.updateNotification(mockId, { title: 'Updated' }),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification not found'),
      );
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete a notification', async () => {
      (Notification.findById as jest.Mock).mockResolvedValue(
        mockNotificationDoc,
      );

      await NotificationService.deleteNotification(mockId);

      expect(mockNotificationDoc.softDelete).toHaveBeenCalled();
    });

    it('should throw error if notification not found', async () => {
      (Notification.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        NotificationService.deleteNotification(mockId),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification not found'),
      );
    });
  });
});
