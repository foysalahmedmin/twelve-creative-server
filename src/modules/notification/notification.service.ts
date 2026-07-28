import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  generateCacheKey,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import * as NotificationRepository from './notification.repository';
import { TNotification } from './notification.type';

const CACHE_PREFIX = 'notification';
const CACHE_TTL = 300; // 5 minutes

export const createNotification = async (
  data: TNotification,
): Promise<TNotification> => {
  const result = await NotificationRepository.create(data);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};

export const getNotification = async (id: string): Promise<TNotification> => {
  return await withCache(
    generateCacheKey(CACHE_PREFIX, ['id', id]),
    CACHE_TTL,
    async () => {
      const result = await NotificationRepository.findByIdLean(id);
      if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
      }
      return result;
    },
  );
};

export const getNotifications = async (
  query: Record<string, unknown>,
): Promise<{
  data: TNotification[];
  meta: { total: number; page: number; limit: number };
}> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['list', query]);
  return await withCache(cacheKey, CACHE_TTL, () =>
    NotificationRepository.findPaginated(query),
  );
};

export const updateNotification = async (
  id: string,
  payload: Partial<
    Pick<TNotification, 'title' | 'message' | 'type' | 'priority'>
  >,
): Promise<TNotification> => {
  const exists = await NotificationRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  const result = await NotificationRepository.updateById(id, payload);
  if (result) {
    await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  }

  return result!;
};

export const updateNotifications = async (
  ids: string[],
  payload: Partial<Pick<TNotification, 'status'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await NotificationRepository.findManyByIds(ids);
  const foundIds = notifications.map((n) => n._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await NotificationRepository.updateManyByIds(
    foundIds,
    payload,
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteNotification = async (id: string): Promise<void> => {
  const notification = await NotificationRepository.findById(id);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  await notification.softDelete();
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
};

export const deleteNotificationPermanent = async (
  id: string,
): Promise<void> => {
  const notification = await NotificationRepository.findByIdWithBypass(id);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  await NotificationRepository.hardDeleteById(id);
};

export const deleteNotifications = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await NotificationRepository.findManyByIds(ids);
  const foundIds = notifications.map((n) => n._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await NotificationRepository.softDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteNotificationsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await NotificationRepository.findManyByIdsBypass(ids, {
    is_deleted: true,
  });
  const foundIds = notifications.map((n) => n._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await NotificationRepository.hardDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreNotification = async (
  id: string,
): Promise<TNotification> => {
  const notification = await NotificationRepository.restoreById(id);

  if (!notification) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification not found or not deleted',
    );
  }

  return notification;
};

export const restoreNotifications = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await NotificationRepository.restoreManyByIds(ids);

  const restoredNotifications = await NotificationRepository.findManyByIds(ids);
  const restoredIds = restoredNotifications.map((n) => n._id!.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
