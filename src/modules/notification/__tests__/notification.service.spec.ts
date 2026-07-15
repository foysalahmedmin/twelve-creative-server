import httpStatus from 'http-status';

jest.mock('../notification.repository');
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(
    (prefix: string, parts: unknown[]) => `${prefix}:${JSON.stringify(parts)}`,
  ),
  invalidateCacheByPattern: jest.fn().mockResolvedValue(undefined),
  withCache: jest.fn(
    (_key: string, _ttl: number, callback: () => Promise<unknown>) =>
      callback(),
  ),
}));

import { invalidateCacheByPattern } from '../../../utils/cache.utils';
import * as NotificationRepository from '../notification.repository';
import * as NotificationService from '../notification.service';

const id = '507f1f77bcf86cd799439011';
const notification = {
  _id: id,
  title: 'New booking',
  message: 'A booking request arrived',
  type: 'booking' as const,
  priority: 'medium' as const,
  channels: ['web' as const],
  status: 'active' as const,
  is_deleted: false,
};

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a notification and invalidates list/detail caches', async () => {
    (NotificationRepository.create as jest.Mock).mockResolvedValue(
      notification,
    );

    await expect(
      NotificationService.createNotification(notification as any),
    ).resolves.toEqual(notification);
    expect(NotificationRepository.create).toHaveBeenCalledWith(notification);
    expect(invalidateCacheByPattern).toHaveBeenCalledWith('notification:*');
  });

  it('gets a notification by id through the cache wrapper', async () => {
    (NotificationRepository.findByIdLean as jest.Mock).mockResolvedValue(
      notification,
    );

    await expect(NotificationService.getNotification(id)).resolves.toEqual(
      notification,
    );
    expect(NotificationRepository.findByIdLean).toHaveBeenCalledWith(id);
  });

  it('throws 404 when a notification is not found', async () => {
    (NotificationRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(NotificationService.getNotification(id)).rejects.toMatchObject(
      {
        status: httpStatus.NOT_FOUND,
        message: 'Notification not found',
      },
    );
  });

  it('returns paginated notifications through the cache wrapper', async () => {
    const page = {
      data: [notification],
      meta: { total: 1, page: 1, limit: 10 },
    };
    (NotificationRepository.findPaginated as jest.Mock).mockResolvedValue(page);

    await expect(
      NotificationService.getNotifications({ type: 'booking' }),
    ).resolves.toEqual(page);
    expect(NotificationRepository.findPaginated).toHaveBeenCalledWith({
      type: 'booking',
    });
  });

  it('updates an existing notification and invalidates caches', async () => {
    const updated = { ...notification, title: 'Updated title' };
    (NotificationRepository.findByIdLean as jest.Mock).mockResolvedValue(
      notification,
    );
    (NotificationRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(
      NotificationService.updateNotification(id, { title: updated.title }),
    ).resolves.toEqual(updated);
    expect(NotificationRepository.updateById).toHaveBeenCalledWith(id, {
      title: updated.title,
    });
    expect(invalidateCacheByPattern).toHaveBeenCalledWith('notification:*');
  });

  it('does not update a missing notification', async () => {
    (NotificationRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      NotificationService.updateNotification(id, { title: 'Missing' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(NotificationRepository.updateById).not.toHaveBeenCalled();
  });

  it('bulk-updates found notifications and reports missing ids', async () => {
    (NotificationRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...notification, _id: { toString: () => 'found' } },
    ]);
    (NotificationRepository.updateManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });

    await expect(
      NotificationService.updateNotifications(['found', 'missing'], {
        status: 'inactive',
      }),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(NotificationRepository.updateManyByIds).toHaveBeenCalledWith(
      ['found'],
      { status: 'inactive' },
    );
  });

  it('soft-deletes an existing notification and invalidates caches', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (NotificationRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await expect(
      NotificationService.deleteNotification(id),
    ).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
    expect(invalidateCacheByPattern).toHaveBeenCalledWith('notification:*');
  });

  it('does not soft-delete a missing notification', async () => {
    (NotificationRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      NotificationService.deleteNotification(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('permanently deletes an existing notification using the bypass lookup', async () => {
    (NotificationRepository.findByIdWithBypass as jest.Mock).mockResolvedValue(
      notification,
    );

    await expect(
      NotificationService.deleteNotificationPermanent(id),
    ).resolves.toBeUndefined();
    expect(NotificationRepository.hardDeleteById).toHaveBeenCalledWith(id);
  });

  it('does not permanently delete a missing notification', async () => {
    (NotificationRepository.findByIdWithBypass as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      NotificationService.deleteNotificationPermanent(id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(NotificationRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('bulk soft-deletes found notifications and reports missing ids', async () => {
    (NotificationRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...notification, _id: { toString: () => 'found' } },
    ]);

    await expect(
      NotificationService.deleteNotifications(['found', 'missing']),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(NotificationRepository.softDeleteManyByIds).toHaveBeenCalledWith([
      'found',
    ]);
  });

  it('bulk permanently deletes only deleted records and reports missing ids', async () => {
    (NotificationRepository.findManyByIdsBypass as jest.Mock).mockResolvedValue(
      [{ ...notification, _id: { toString: () => 'deleted' } }],
    );

    await expect(
      NotificationService.deleteNotificationsPermanent(['deleted', 'missing']),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(NotificationRepository.findManyByIdsBypass).toHaveBeenCalledWith(
      ['deleted', 'missing'],
      { is_deleted: true },
    );
    expect(NotificationRepository.hardDeleteManyByIds).toHaveBeenCalledWith([
      'deleted',
    ]);
  });

  it('restores one deleted notification', async () => {
    (NotificationRepository.restoreById as jest.Mock).mockResolvedValue(
      notification,
    );

    await expect(NotificationService.restoreNotification(id)).resolves.toEqual(
      notification,
    );
  });

  it('throws 404 when one notification cannot be restored', async () => {
    (NotificationRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      NotificationService.restoreNotification(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Notification not found or not deleted',
    });
  });

  it('bulk-restores notifications and reports ids that remain missing', async () => {
    (NotificationRepository.restoreManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });
    (NotificationRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...notification, _id: { toString: () => 'restored' } },
    ]);

    await expect(
      NotificationService.restoreNotifications(['restored', 'missing']),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(NotificationRepository.restoreManyByIds).toHaveBeenCalledWith([
      'restored',
      'missing',
    ]);
  });
});
