/**
 * NotificationRecipient Repository
 *
 * Handles ALL direct database interactions for the NotificationRecipient module.
 */

import AppQueryFind from '../../builder/app-query-find';
import { NotificationRecipient } from './notification-recipient.model';
import {
  TNotificationRecipient,
  TNotificationRecipientDocument,
} from './notification-recipient.type';

// ─── Create ───────────────────────────────────────────────────────────────────

export const create = async (
  data: Partial<TNotificationRecipient>,
): Promise<TNotificationRecipient> => {
  const result = await NotificationRecipient.create(data);
  return result.toObject();
};

// ─── Find One ─────────────────────────────────────────────────────────────────

export const findById = async (
  id: string,
): Promise<TNotificationRecipientDocument | null> => {
  return await NotificationRecipient.findById(id).populate([
    { path: 'recipient', select: '_id name email image' },
    {
      path: 'notification',
      select: '_id title message type sender priority channels created_at',
    },
  ]);
};

export const findByIdLean = async (
  id: string,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findById(id).lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
): Promise<TNotificationRecipientDocument | null> => {
  return await NotificationRecipient.findOne(filter).populate([
    { path: 'recipient', select: '_id name email image' },
    {
      path: 'notification',
      select: '_id title message type sender priority channels created_at',
    },
  ]);
};

export const findOneLean = async (
  filter: Record<string, unknown>,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findOne(filter).lean();
};

export const findByIdWithBypass = async (
  id: string,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

// ─── Find Many ────────────────────────────────────────────────────────────────

export const findManyByIds = async (
  ids: string[],
): Promise<TNotificationRecipient[]> => {
  return await NotificationRecipient.find({ _id: { $in: ids } }).lean();
};

export const findManyByFilter = async (
  filter: Record<string, unknown>,
): Promise<TNotificationRecipient[]> => {
  return await NotificationRecipient.find(filter).lean();
};

export const findByRecipient = async (
  recipientId: string,
): Promise<TNotificationRecipient[]> => {
  return await NotificationRecipient.find({ recipient: recipientId }).lean();
};

// ─── Paginated Lists ─────────────────────────────────────────────────────────

export const findPaginated = async (
  query: Record<string, unknown>,
  filterOverride: Record<string, unknown> = {},
): Promise<{
  data: TNotificationRecipient[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const NotificationRecipientQuery = new AppQueryFind(NotificationRecipient, {
    ...query,
    ...filterOverride,
  })
    .populate([
      { path: 'recipient', select: '_id name email image' },
      { path: 'notification', select: '_id title type sender' },
    ])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await NotificationRecipientQuery.execute();
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateById = async (
  id: string,
  payload: Partial<TNotificationRecipient>,
): Promise<TNotificationRecipientDocument | null> => {
  return await NotificationRecipient.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateManyByIds = async (
  ids: string[],
  payload: Partial<TNotificationRecipient>,
): Promise<{ modifiedCount: number }> => {
  return await NotificationRecipient.updateMany(
    { _id: { $in: ids } },
    { ...payload },
  );
};

export const updateManyByFilter = async (
  filter: Record<string, unknown>,
  payload: Partial<TNotificationRecipient>,
): Promise<{ modifiedCount: number }> => {
  return await NotificationRecipient.updateMany(filter, { ...payload });
};

export const restoreById = async (
  id: string,
): Promise<TNotificationRecipientDocument | null> => {
  return await NotificationRecipient.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );
};

export const restoreManyByIds = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await NotificationRecipient.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const softDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await NotificationRecipient.updateMany(
    { _id: { $in: ids } },
    { is_deleted: true },
  );
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await NotificationRecipient.findByIdAndDelete(id);
};

export const hardDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await NotificationRecipient.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};
