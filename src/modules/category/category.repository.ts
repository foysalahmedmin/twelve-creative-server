import AppQueryFind from '../../builder/app-query-find';
import { Category } from './category.model';
import { TCategory, TCategoryDocument } from './category.type';

export const create = async (data: Partial<TCategory>): Promise<TCategory> => {
  const result = await Category.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TCategoryDocument | null> => {
  return await Category.findById(id);
};

export const findByIdLean = async (id: string): Promise<TCategory | null> => {
  return await Category.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TCategory | null> => {
  return await Category.findById(id).setOptions({ bypassDeleted: true }).lean();
};

export const findPublicPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TCategory[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const publicQueryParams = { ...query };
  delete publicQueryParams.status;
  delete publicQueryParams.is_deleted;
  delete publicQueryParams.fields;
  delete publicQueryParams.or;
  delete publicQueryParams.and;

  publicQueryParams.status = 'active';
  publicQueryParams.is_deleted = { $ne: true };
  if (!publicQueryParams.sort) publicQueryParams.sort = 'sequence';
  if (!publicQueryParams.page) publicQueryParams.page = '1';
  if (!publicQueryParams.limit) publicQueryParams.limit = '100';

  const categoryQuery = new AppQueryFind(Category, publicQueryParams)
    .search(['name'])
    .filter(['status', 'is_deleted', 'is_featured', 'layout', 'tags'])
    .sort(['sequence', 'name', 'is_featured'])
    .paginate()
    .fields([
      '_id',
      'icon',
      'name',
      'description',
      'sequence',
      'status',
      'tags',
      'layout',
      'is_featured',
    ])
    .tap((q) => q.lean());
  return await categoryQuery.execute();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TCategory[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const categoryQuery = new AppQueryFind(Category, query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());
  return await categoryQuery.execute([
    { key: 'active', filter: { status: 'active' } },
    { key: 'inactive', filter: { status: 'inactive' } },
    { key: 'featured', filter: { is_featured: true } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TCategory>,
): Promise<TCategoryDocument | null> => {
  return await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Category.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const restoreById = async (
  id: string,
): Promise<TCategoryDocument | null> => {
  return await Category.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Category.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
