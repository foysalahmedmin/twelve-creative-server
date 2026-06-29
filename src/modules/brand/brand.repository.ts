import AppQueryFind from '../../builder/app-query-find';
import { Brand } from './brand.model';
import { TBrand, TBrandDocument } from './brand.type';

export const create = async (data: Partial<TBrand>): Promise<TBrand> => {
  const result = await Brand.create(data);
  return result.toObject();
};

export const findById = async (id: string): Promise<TBrandDocument | null> => {
  return await Brand.findById(id);
};

export const findByIdLean = async (id: string): Promise<TBrand | null> => {
  return await Brand.findById(id).lean();
};

export const findPublic = async (): Promise<TBrand[]> => {
  return await Brand.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TBrand[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'active') qp.is_active = true;
  else if (qp.filter === 'inactive') qp.is_active = false;

  const q = new AppQueryFind(Brand, qp)
    .search(['name'])
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
  payload: Partial<TBrand>,
): Promise<TBrandDocument | null> => {
  return await Brand.findByIdAndUpdate(id, payload, {
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
  await Brand.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Brand.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Brand.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
