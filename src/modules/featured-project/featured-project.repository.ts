import AppQueryFind from '../../builder/app-query-find';
import * as IndustryRepository from '../industry/industry.repository';
import { FeaturedProject } from './featured-project.model';
import {
  TFeaturedProject,
  TFeaturedProjectDocument,
  TFeaturedProjectPopulated,
} from './featured-project.type';

const INDUSTRY_POPULATE = {
  path: 'industry',
  select: '_id name slug order is_active',
};

export const create = async (
  data: Partial<TFeaturedProject>,
): Promise<TFeaturedProjectDocument> => {
  return await FeaturedProject.create(data);
};

export const findById = async (
  id: string,
): Promise<TFeaturedProjectDocument | null> => {
  return await FeaturedProject.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TFeaturedProjectPopulated | null> => {
  return (await FeaturedProject.findById(id)
    .populate(INDUSTRY_POPULATE)
    .lean()) as TFeaturedProjectPopulated | null;
};

export const findByIdWithDeletedLean = async (
  id: string,
): Promise<TFeaturedProject | null> => {
  return await FeaturedProject.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPublic = async (
  industrySlug?: string,
): Promise<TFeaturedProjectPopulated[]> => {
  const industryIds = await IndustryRepository.findActiveIds(industrySlug);
  if (!industryIds.length) return [];

  return (await FeaturedProject.find({
    is_active: true,
    industry: { $in: industryIds },
  })
    .populate(INDUSTRY_POPULATE)
    .sort({ order: 1, created_at: -1 })
    .lean()) as unknown as TFeaturedProjectPopulated[];
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturedProjectPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'active') qp.is_active = true;
  else if (qp.filter === 'inactive') qp.is_active = false;
  if (!qp.sort) qp.sort = 'order';

  const q = new AppQueryFind(FeaturedProject, qp)
    .search(['title'])
    .filter(['industry', 'aspect', 'is_active'])
    .sort(['order', 'title', 'aspect', 'is_active'])
    .paginate()
    .fields()
    .populate(INDUSTRY_POPULATE)
    .tap((c) => c.lean());

  const result = await q.execute([
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);

  return result as unknown as {
    data: TFeaturedProjectPopulated[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  };
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
  industry: string,
): Promise<void> => {
  if (!items.length) return;
  const ops = items.map(({ _id, order }) => ({
    updateOne: {
      filter: { _id, industry },
      update: { $set: { order } },
    },
  }));
  await FeaturedProject.bulkWrite(ops);
};

export const findReorderRecords = async (
  ids: string[],
): Promise<Pick<TFeaturedProject, '_id' | 'industry'>[]> => {
  return await FeaturedProject.find({ _id: { $in: ids } })
    .select('_id industry')
    .lean();
};

export const restoreById = async (
  id: string,
): Promise<TFeaturedProjectDocument | null> => {
  return await FeaturedProject.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const countByIndustry = async (industry: string): Promise<number> => {
  return await FeaturedProject.countDocuments({ industry });
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
