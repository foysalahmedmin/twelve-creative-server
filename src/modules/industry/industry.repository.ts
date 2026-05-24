import AppQueryFind from '../../builder/app-query-find';
import { Industry } from './industry.model';
import { TIndustry, TIndustryDocument } from './industry.type';

export const create = async (data: Partial<TIndustry>): Promise<TIndustry> => {
  const result = await Industry.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TIndustryDocument | null> => {
  return await Industry.findById(id);
};

export const findByIdLean = async (id: string): Promise<TIndustry | null> => {
  return await Industry.findById(id).lean();
};

export const findBySlugLean = async (
  slug: string,
): Promise<TIndustry | null> => {
  return await Industry.findOne({ slug }).lean();
};

export const findPublic = async (): Promise<TIndustry[]> => {
  return await Industry.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TIndustry[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q = new AppQueryFind(Industry, query)
    .search(['name', 'slug', 'headline', 'description'])
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
  payload: Partial<TIndustry>,
): Promise<TIndustryDocument | null> => {
  return await Industry.findByIdAndUpdate(id, payload, {
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
  await Industry.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Industry.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const restoreById = async (
  id: string,
): Promise<TIndustryDocument | null> => {
  return await Industry.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Industry.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
