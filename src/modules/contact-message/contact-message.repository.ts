import AppQueryFind from '../../builder/app-query-find';
import { ContactMessage } from './contact-message.model';
import {
  TContactMessage,
  TContactMessageDocument,
} from './contact-message.type';

export const create = async (
  data: Partial<TContactMessage>,
): Promise<TContactMessage> => {
  const result = await ContactMessage.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TContactMessageDocument | null> => {
  return await ContactMessage.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TContactMessage | null> => {
  return await ContactMessage.findById(id).lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TContactMessage[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'unread') {
    qp.is_read = false;
    qp.is_archived = false;
  } else if (qp.filter === 'read') {
    qp.is_read = true;
    qp.is_archived = false;
  } else if (qp.filter === 'archived') {
    qp.is_archived = true;
  }

  const q = new AppQueryFind(ContactMessage, qp)
    .search(['name', 'email', 'subject', 'message'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((c) => c.lean());

  return await q.execute([
    { key: 'unread', filter: { is_read: false, is_archived: false } },
    { key: 'read', filter: { is_read: true, is_archived: false } },
    { key: 'archived', filter: { is_archived: true } },
  ]);
};

export const countUnread = async (): Promise<number> => {
  return await ContactMessage.countDocuments({
    is_read: false,
    is_archived: false,
  });
};

export const updateById = async (
  id: string,
  payload: Partial<TContactMessage>,
): Promise<TContactMessageDocument | null> => {
  return await ContactMessage.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await ContactMessage.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await ContactMessage.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });
};
