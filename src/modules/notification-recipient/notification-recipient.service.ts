import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import AppQueryFind from '../../builder/app-query-find';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import {
  generateCacheKey,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import { NotificationRecipient } from './notification-recipient.model';
import * as NotificationRecipientRepository from './notification-recipient.repository';
import { TNotificationRecipient } from './notification-recipient.type';

const CACHE_PREFIX = 'notification-recipient';
const CACHE_TTL = 300; // 5 minutes

export const createNotificationRecipient = async (
  data: TNotificationRecipient,
): Promise<TNotificationRecipient> => {
  const result = await NotificationRecipientRepository.create(data);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};

export const getSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<TNotificationRecipient> => {
  return await withCache(
    generateCacheKey(CACHE_PREFIX, ['self', user._id, id]),
    CACHE_TTL,
    async () => {
      // Custom populate chain — kept as direct model call
      const result = await NotificationRecipient.findOne({
        _id: id,
        recipient: user._id,
      })
        .populate([
          { path: 'recipient', select: '_id name email image' },
          {
            path: 'notification',
            select: '_id title message type sender priority channels',
          },
        ])
        .lean();

      if (!result) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Notification recipient not found',
        );
      }
      return result;
    },
  );
};

export const getNotificationRecipient = async (
  id: string,
): Promise<TNotificationRecipient> => {
  return await withCache(
    generateCacheKey(CACHE_PREFIX, ['id', id]),
    CACHE_TTL,
    async () => {
      const result = await NotificationRecipientRepository.findByIdLean(id);

      if (!result) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Notification recipient not found',
        );
      }
      return result;
    },
  );
};

export const getSelfNotificationRecipients = async (
  user: TJwtPayload,
  query: Record<string, unknown>,
): Promise<{
  data: TNotificationRecipient[];
  meta: { total: number; page: number; limit: number };
}> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, [
    'self',
    user._id,
    'list',
    query,
  ]);
  return await withCache(cacheKey, CACHE_TTL, async () => {
    const notificationQuery = new AppQueryFind(NotificationRecipient, {
      recipient: user._id,
      ...query,
    })
      .populate([
        { path: 'recipient', select: '_id name email image' },
        {
          path: 'notification',
          select: '_id title message type sender priority channels created_at',
          populate: { path: 'sender', select: '_id name email image' },
        },
      ])
      .filter()
      .sort()
      .paginate()
      .fields()
      .tap((q) => q.lean());

    return await notificationQuery.execute([
      {
        key: 'unread',
        filter: { is_read: false, recipient: user._id },
      },
    ]);
  });
};

export const getNotificationRecipients = async (
  query: Record<string, unknown>,
): Promise<{
  data: TNotificationRecipient[];
  meta: { total: number; page: number; limit: number };
}> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['admin', 'list', query]);
  return await withCache(cacheKey, CACHE_TTL, async () => {
    const notificationQuery = new AppQueryFind(NotificationRecipient, query)
      .populate([
        { path: 'recipient', select: '_id name email image' },
        { path: 'notification', select: '_id title type sender' },
      ])
      .filter()
      .sort()
      .paginate()
      .fields()
      .tap((q) => q.lean());

    return await notificationQuery.execute([
      {
        key: 'unread',
        filter: { is_read: false },
      },
    ]);
  });
};

export const updateSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<TNotificationRecipient> => {
  const exists = await NotificationRecipientRepository.findOneLean({
    _id: id,
    recipient: user._id,
  });

  if (!exists) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found',
    );
  }

  const updatePayload = {
    ...payload,
    ...(payload.is_read === true && !payload.read_at
      ? { read_at: new Date() }
      : {}),
    ...(payload.is_read === false ? { read_at: null } : {}),
  };

  // Custom populate chain — kept as direct model call
  const result = await NotificationRecipient.findByIdAndUpdate(
    id,
    updatePayload,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate([
      { path: 'recipient', select: '_id name email image' },
      {
        path: 'notification',
        select: '_id title message type sender priority channels created_at',
        populate: { path: 'sender', select: '_id name email image' },
      },
    ])
    .lean();

  if (result) {
    await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  }

  return result!;
};

export const updateNotificationRecipient = async (
  id: string,
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<TNotificationRecipient> => {
  const exists = await NotificationRecipientRepository.findByIdLean(id);

  if (!exists) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found',
    );
  }

  const result = await NotificationRecipientRepository.updateById(id, payload);

  if (result) {
    await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  }

  return result!;
};

export const readAllNotificationRecipients = async (
  user: TJwtPayload,
): Promise<{ count: number }> => {
  const result = await NotificationRecipientRepository.updateManyByFilter(
    { recipient: user._id, is_read: false },
    { is_read: true, read_at: new Date() },
  );

  if (result.modifiedCount > 0) {
    await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  }

  return { count: result.modifiedCount };
};

export const updateSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const recipients = await NotificationRecipientRepository.findManyByFilter({
    _id: { $in: ids },
    recipient: user._id,
  });

  const foundIds = recipients.map((r) => r._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const updatePayload = {
    ...payload,
    ...(payload.is_read === true && !payload.read_at
      ? { read_at: new Date() }
      : {}),
    ...(payload.is_read === false ? { read_at: null } : {}),
  };

  const result = await NotificationRecipientRepository.updateManyByFilter(
    { _id: { $in: foundIds }, recipient: user._id },
    updatePayload,
  );

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const updateNotificationRecipients = async (
  ids: string[],
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const recipients = await NotificationRecipientRepository.findManyByIds(ids);
  const foundIds = recipients.map((r) => r._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await NotificationRecipientRepository.updateManyByIds(
    foundIds,
    payload,
  );

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const deleteSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<void> => {
  const data = await NotificationRecipientRepository.findOne({
    _id: id,
    recipient: user._id,
  });
  if (!data) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found',
    );
  }

  await data.softDelete();
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
};

export const deleteNotificationRecipient = async (
  id: string,
): Promise<void> => {
  const data = await NotificationRecipientRepository.findById(id);
  if (!data) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found',
    );
  }

  await data.softDelete();
};

export const deleteNotificationRecipientPermanent = async (
  id: string,
): Promise<void> => {
  const data = await NotificationRecipientRepository.findByIdWithBypass(id);
  if (!data) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found',
    );
  }

  await NotificationRecipientRepository.hardDeleteById(id);
};

export const deleteSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findManyByFilter({
    _id: { $in: ids },
    recipient: user._id,
  });

  const foundIds = data.map((d) => d._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await NotificationRecipientRepository.softDeleteManyByIds(foundIds);

  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteNotificationRecipients = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findManyByIds(ids);
  const foundIds = data.map((d) => d._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await NotificationRecipientRepository.softDeleteManyByIds(foundIds);

  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteNotificationRecipientsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findManyByFilter({
    _id: { $in: ids },
    is_deleted: true,
  });
  const foundIds = data.map((d) => d._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await NotificationRecipientRepository.hardDeleteManyByIds(foundIds);

  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<TNotificationRecipient> => {
  // Custom populate chain — kept as direct model call
  const data = await NotificationRecipient.findOneAndUpdate(
    { _id: id, is_deleted: true, recipient: user._id },
    { is_deleted: false },
    { new: true },
  )
    .populate([
      { path: 'recipient', select: '_id name email image' },
      {
        path: 'notification',
        select: '_id title message type sender priority channels created_at',
        populate: { path: 'sender', select: '_id name email image' },
      },
    ])
    .lean();

  if (!data) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found or not deleted',
    );
  }

  return data;
};

export const restoreNotificationRecipient = async (
  id: string,
): Promise<TNotificationRecipient> => {
  const data = await NotificationRecipientRepository.restoreById(id);

  if (!data) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification recipient not found or not deleted',
    );
  }

  return data;
};

export const restoreSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await NotificationRecipientRepository.updateManyByFilter(
    { _id: { $in: ids }, is_deleted: true, recipient: user._id },
    { is_deleted: false },
  );

  const restored = await NotificationRecipientRepository.findManyByFilter({
    _id: { $in: ids },
    recipient: user._id,
  });

  const restoredIds = restored.map((r) => r._id!.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const restoreNotificationRecipients = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await NotificationRecipientRepository.restoreManyByIds(ids);

  const restored = await NotificationRecipientRepository.findManyByIds(ids);
  const restoredIds = restored.map((r) => r._id!.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
