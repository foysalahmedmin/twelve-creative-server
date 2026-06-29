import AppQueryFind from '../../builder/app-query-find';
import { Work } from './work.model';
import { TWork, TWorkDocument } from './work.type';

export const create = async (data: Partial<TWork>): Promise<TWork> => {
  const result = await Work.create(data);
  return result.toObject();
};

export const findById = async (id: string): Promise<TWorkDocument | null> => {
  return await Work.findById(id);
};

export const findByIdLean = async (id: string): Promise<TWork | null> => {
  return await Work.findById(id).lean();
};

export const findBySlugLean = async (slug: string): Promise<TWork | null> => {
  return await Work.findOne({ slug, is_published: true }).lean();
};

export const findPublicList = async (): Promise<TWork[]> => {
  return await Work.find({ is_published: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TWork[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'published') qp.is_published = true;
  else if (qp.filter === 'draft') qp.is_published = false;

  const q = new AppQueryFind(Work, qp)
    .search(['title', 'slug', 'type', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((c) => c.lean());

  return await q.execute([
    { key: 'published', filter: { is_published: true } },
    { key: 'draft', filter: { is_published: false } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TWork>,
): Promise<TWorkDocument | null> => {
  return await Work.findByIdAndUpdate(id, payload, {
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
  await Work.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Work.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Work.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
