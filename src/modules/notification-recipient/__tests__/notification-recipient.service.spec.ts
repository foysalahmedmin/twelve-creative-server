import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../../builder/app-error';
import { TJwtPayload } from '../../../types/jsonwebtoken.type';
import * as NotificationRecipientService from '../notification-recipient.service';
import { TNotificationRecipient } from '../notification-recipient.type';

// Mock the model used directly in the service
jest.mock('../notification-recipient.model', () => ({
  NotificationRecipient: {
    create: jest.fn(),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    }),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
  },
}));
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(),
  invalidateCacheByPattern: jest.fn(),
  withCache: jest.fn((_key: string, _ttl: number, cb: () => Promise<unknown>) =>
    cb(),
  ),
}));
jest.mock('../../../builder/app-query-find', () => {
  return jest.fn().mockImplementation(() => ({
    populate: jest.fn().mockReturnThis(),
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

import { NotificationRecipient } from '../notification-recipient.model';

describe('NotificationRecipient Service', () => {
  const mockUser: TJwtPayload = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  };
  const mockId = new mongoose.Types.ObjectId().toString();
  const mockNotificationId = new mongoose.Types.ObjectId();
  const mockRecipientId = new mongoose.Types.ObjectId();

  const mockRecipient: TNotificationRecipient = {
    notification: mockNotificationId,
    recipient: mockRecipientId,
    metadata: {},
    is_read: false,
    is_deleted: false,
  };

  const mockRecipientDoc = {
    ...mockRecipient,
    _id: new mongoose.Types.ObjectId(),
    toObject: () => mockRecipient,
    softDelete: jest.fn().mockResolvedValue(undefined),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotificationRecipient', () => {
    it('should create a notification recipient', async () => {
      (NotificationRecipient.create as jest.Mock).mockResolvedValue(
        mockRecipientDoc,
      );

      const result =
        await NotificationRecipientService.createNotificationRecipient(
          mockRecipient,
        );

      expect(NotificationRecipient.create).toHaveBeenCalledWith(mockRecipient);
      expect(result).toEqual(mockRecipient);
    });
  });

  describe('getNotificationRecipient', () => {
    it('should return a notification recipient by id', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRecipient),
      });

      const result =
        await NotificationRecipientService.getNotificationRecipient(mockId);

      expect(NotificationRecipient.findById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockRecipient);
    });

    it('should throw error if recipient not found', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        NotificationRecipientService.getNotificationRecipient(mockId),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });

  describe('getNotificationRecipients', () => {
    it('should return paginated notification recipients', async () => {
      const result =
        await NotificationRecipientService.getNotificationRecipients({});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('updateNotificationRecipient', () => {
    it('should update a notification recipient', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRecipient),
      });
      (NotificationRecipient.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockRecipient, is_read: true }),
      });

      const result =
        await NotificationRecipientService.updateNotificationRecipient(mockId, {
          is_read: true,
        });

      expect(result).toBeDefined();
    });

    it('should throw error if recipient not found on update', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        NotificationRecipientService.updateNotificationRecipient(mockId, {
          is_read: true,
        }),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });

  describe('deleteNotificationRecipient', () => {
    it('should soft delete a notification recipient', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRecipientDoc),
      });

      await NotificationRecipientService.deleteNotificationRecipient(mockId);

      expect(mockRecipientDoc.softDelete).toHaveBeenCalled();
    });

    it('should throw error if recipient not found on delete', async () => {
      (NotificationRecipient.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        NotificationRecipientService.deleteNotificationRecipient(mockId),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });

  describe('getSelfNotificationRecipient', () => {
    it('should return recipient for the authenticated user', async () => {
      (NotificationRecipient.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRecipient),
        }),
      });

      const result =
        await NotificationRecipientService.getSelfNotificationRecipient(
          mockUser,
          mockId,
        );

      expect(NotificationRecipient.findOne).toHaveBeenCalledWith({
        _id: mockId,
        recipient: mockUser._id,
      });
      expect(result).toEqual(mockRecipient);
    });

    it('should throw error if recipient not found', async () => {
      (NotificationRecipient.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        NotificationRecipientService.getSelfNotificationRecipient(
          mockUser,
          mockId,
        ),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });
});
