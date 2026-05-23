import AppQueryFind from '../../builder/app-query-find';
import { FeaturedProject } from './featured-project.model';
import {
  TFeaturedProject,
  TFeaturedProjectDocument,
} from './featured-project.type';

export const create = async (
  data: Partial<TFeaturedProject>,
): Promise<TFeaturedProject> => {
  const result = await FeaturedProject.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TFeaturedProjectDocument | null> => {
  return await FeaturedProject.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TFeaturedProject | null> => {
  return await FeaturedProject.findById(id).lean();
};

export const findPublic = async (): Promise<TFeaturedProject[]> => {
  return await FeaturedProject.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturedProject[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q = new AppQueryFind(FeaturedProject, query)
    .search(['title', 'category'])
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
  payload: Partial<TFeaturedProject>,
): Promise<TFeaturedProjectDocument | null> => {
  return await FeaturedProject.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateOrder = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  if (!items.length) return;
  const ops = items.map(({ _id, order }) => ({
    updateOne: {
      filter: { _id },
      update: { $set: { order } },
    },
  }));
  await FeaturedProject.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await FeaturedProject.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await FeaturedProject.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });
};
