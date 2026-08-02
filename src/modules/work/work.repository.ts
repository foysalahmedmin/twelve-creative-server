import AppQueryFind from '../../builder/app-query-find';
import * as IndustryRepository from '../industry/industry.repository';
import { Work } from './work.model';
import { TWork, TWorkDocument, TWorkPopulated } from './work.type';

const INDUSTRY_POPULATE = {
  path: 'industry',
  select: '_id name slug order is_active',
};

export const create = async (data: Partial<TWork>): Promise<TWorkDocument> => {
  return await Work.create(data);
};

export const findById = async (id: string): Promise<TWorkDocument | null> => {
  return await Work.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TWorkPopulated | null> => {
  return (await Work.findById(id)
    .populate(INDUSTRY_POPULATE)
    .lean()) as TWorkPopulated | null;
};

export const findByIdWithDeletedLean = async (
  id: string,
): Promise<TWork | null> => {
  return await Work.findById(id).setOptions({ bypassDeleted: true }).lean();
};

export const findBySlugLean = async (
  slug: string,
): Promise<TWorkPopulated | null> => {
  const activeIndustryIds = await IndustryRepository.findActiveIds();
  return (await Work.findOne({
    slug,
    is_published: true,
    industry: { $in: activeIndustryIds },
  })
    .populate(INDUSTRY_POPULATE)
    .lean()) as TWorkPopulated | null;
};

export const findPublicList = async (
  industrySlug?: string,
): Promise<TWorkPopulated[]> => {
  const industryIds = await IndustryRepository.findActiveIds(industrySlug);
  if (!industryIds.length) return [];

  return (await Work.find({
    is_published: true,
    industry: { $in: industryIds },
  })
    .populate(INDUSTRY_POPULATE)
    .sort({ order: 1, created_at: -1 })
    .lean()) as unknown as TWorkPopulated[];
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TWorkPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'published') qp.is_published = true;
  else if (qp.filter === 'draft') qp.is_published = false;
  if (!qp.sort) qp.sort = 'order';

  const q = new AppQueryFind(Work, qp)
    .search(['title', 'slug', 'type', 'description'])
    .filter(['industry', 'is_published'])
    .sort(['order', 'title', 'slug', 'type', 'is_published'])
    .paginate()
    .fields()
    .populate(INDUSTRY_POPULATE)
    .tap((c) => c.lean());

  return (await q.execute([
    { key: 'published', filter: { is_published: true } },
    { key: 'draft', filter: { is_published: false } },
  ])) as unknown as {
    data: TWorkPopulated[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  };
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

export const countExistingByIds = async (ids: string[]): Promise<number> => {
  return await Work.countDocuments({
    _id: { $in: ids },
    is_deleted: { $ne: true },
  });
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

export const countByIndustry = async (industry: string): Promise<number> => {
  return await Work.countDocuments({ industry });
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TWorkDocument | null> => {
  return await Work.findById(id).setOptions({ bypassDeleted: true });
};

/** Clears the soft-delete marker. Returns null when the row was not deleted. */
export const restoreById = async (
  id: string,
): Promise<TWorkDocument | null> => {
  return await Work.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};
