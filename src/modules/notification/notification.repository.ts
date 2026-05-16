/**
 * Notification Repository
 *
 * Handles ALL direct database interactions for the Notification module.
 */

import AppQueryFind from '../../builder/app-query-find';
import { Notification } from './notification.model';
import { TNotification, TNotificationDocument } from './notification.type';

// ─── Create ───────────────────────────────────────────────────────────────────

export const create = async (
  data: Partial<TNotification>,
): Promise<TNotification> => {
  const result = await Notification.create(data);
  return result.toObject();
};

// ─── Find One ─────────────────────────────────────────────────────────────────

export const findById = async (
  id: string,
): Promise<TNotificationDocument | null> => {
  return await Notification.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TNotification | null> => {
  return await Notification.findById(id).lean();
};

export const findByIdWithBypass = async (
  id: string,
): Promise<TNotification | null> => {
  return await Notification.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

// ─── Find Many ────────────────────────────────────────────────────────────────

export const findManyByIds = async (
  ids: string[],
): Promise<TNotification[]> => {
  return await Notification.find({ _id: { $in: ids } }).lean();
};

export const findManyByIdsBypass = async (
  ids: string[],
  filter: Record<string, unknown> = {},
): Promise<TNotification[]> => {
  return await Notification.find({ _id: { $in: ids }, ...filter })
    .setOptions({ bypassDeleted: true })
    .lean();
};

// ─── Paginated Lists ─────────────────────────────────────────────────────────

export const findPaginated = async (
  query: Record<string, unknown>,
  filterOverride: Record<string, unknown> = {},
): Promise<{
  data: TNotification[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const NotificationQuery = new AppQueryFind(Notification, {
    ...query,
    ...filterOverride,
  })
    .search(['title', 'message', 'type', 'priority'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await NotificationQuery.execute();
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateById = async (
  id: string,
  payload: Partial<TNotification>,
): Promise<TNotificationDocument | null> => {
  return await Notification.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateManyByIds = async (
  ids: string[],
  payload: Partial<TNotification>,
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany({ _id: { $in: ids } }, { ...payload });
};

export const restoreById = async (
  id: string,
): Promise<TNotificationDocument | null> => {
  return await Notification.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );
};

export const restoreManyByIds = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const softDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await Notification.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Notification.findByIdAndDelete(id);
};

export const hardDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await Notification.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};
