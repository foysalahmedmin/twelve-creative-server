import AppQueryFind from '../../builder/app-query-find';
import { Faq } from './faq.model';
import { TFaq, TFaqDocument } from './faq.type';

export const create = async (data: Partial<TFaq>): Promise<TFaq> => {
  const result = await Faq.create(data);
  return result.toObject();
};

export const findById = async (id: string): Promise<TFaqDocument | null> => {
  return await Faq.findById(id);
};

export const findByIdLean = async (id: string): Promise<TFaq | null> => {
  return await Faq.findById(id).lean();
};

export const findPublic = async (): Promise<TFaq[]> => {
  return await Faq.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFaq[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q = new AppQueryFind(Faq, query)
    .search(['question', 'answer', 'group'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((c) => c.lean());
  return await q.execute([
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TFaq>,
): Promise<TFaqDocument | null> => {
  return await Faq.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateOrder = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  if (!items.length) return;
  const ops = items.map(({ _id, order }) => ({
    updateOne: { filter: { _id }, update: { $set: { order } } },
  }));
  await Faq.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Faq.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Faq.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
