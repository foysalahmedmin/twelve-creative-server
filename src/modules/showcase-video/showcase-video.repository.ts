import AppQueryFind from '../../builder/app-query-find';
import * as IndustryRepository from '../industry/industry.repository';
import { ShowcaseVideo } from './showcase-video.model';
import {
  TShowcaseVideo,
  TShowcaseVideoDocument,
  TShowcaseVideoPopulated,
} from './showcase-video.type';

const INDUSTRY_POPULATE = {
  path: 'industry',
  select: '_id name slug order is_active',
};

export const create = async (
  data: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideoDocument> => {
  return await ShowcaseVideo.create(data);
};

export const findById = async (
  id: string,
): Promise<TShowcaseVideoDocument | null> => {
  return await ShowcaseVideo.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TShowcaseVideoPopulated | null> => {
  return (await ShowcaseVideo.findById(id)
    .populate(INDUSTRY_POPULATE)
    .lean()) as TShowcaseVideoPopulated | null;
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TShowcaseVideo | null> => {
  return await ShowcaseVideo.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPublic = async (
  options: {
    aspect?: 'reel' | 'landscape';
    industry_slug?: string;
  } = {},
): Promise<TShowcaseVideoPopulated[]> => {
  const industryIds = await IndustryRepository.findActiveIds(
    options.industry_slug,
  );
  if (!industryIds.length) return [];

  const filter: Record<string, unknown> = {
    is_active: true,
    industry: { $in: industryIds },
  };
  if (options.aspect) filter.aspect = options.aspect;
  const videos = (await ShowcaseVideo.find(filter)
    .populate(INDUSTRY_POPULATE)
    .sort({ order: 1, created_at: -1 })
    .lean()) as unknown as TShowcaseVideoPopulated[];

  // `order` is scoped to Industry + aspect. On global surfaces, make the
  // parent Industry order the primary key so equal child orders never produce
  // an unstable/interleaved result.
  return videos.sort((left, right) => {
    const industryOrder =
      (left.industry?.order ?? Number.MAX_SAFE_INTEGER) -
      (right.industry?.order ?? Number.MAX_SAFE_INTEGER);
    if (industryOrder !== 0) return industryOrder;

    const itemOrder = left.order - right.order;
    if (itemOrder !== 0) return itemOrder;

    return String(left._id).localeCompare(String(right._id));
  });
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TShowcaseVideoPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'active') qp.is_active = true;
  else if (qp.filter === 'inactive') qp.is_active = false;
  if (!qp.sort) qp.sort = 'order';

  const q = new AppQueryFind(ShowcaseVideo, qp)
    .search(['alt'])
    .filter(['industry', 'aspect', 'is_active'])
    .sort(['order', 'alt', 'aspect', 'is_active'])
    .paginate()
    .fields()
    .populate(INDUSTRY_POPULATE)
    .tap((c) => c.lean());

  const result = await q.execute([
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);

  return result as unknown as {
    data: TShowcaseVideoPopulated[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  };
};

export const updateById = async (
  id: string,
  payload: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideoDocument | null> => {
  return await ShowcaseVideo.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateOrder = async (
  items: { _id: string; order: number }[],
  industry: string,
  aspect: 'reel' | 'landscape',
): Promise<void> => {
  if (!items.length) return;
  const ops = items.map(({ _id, order }) => ({
    updateOne: {
      filter: { _id, industry, aspect },
      update: { $set: { order } },
    },
  }));
  await ShowcaseVideo.bulkWrite(ops);
};

export const findReorderRecords = async (
  ids: string[],
): Promise<Pick<TShowcaseVideo, '_id' | 'industry' | 'aspect'>[]> => {
  return await ShowcaseVideo.find({ _id: { $in: ids } })
    .select('_id industry aspect')
    .lean();
};

export const countByIndustry = async (industry: string): Promise<number> => {
  return await ShowcaseVideo.countDocuments({ industry });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await ShowcaseVideo.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const restoreById = async (
  id: string,
): Promise<TShowcaseVideoDocument | null> => {
  return await ShowcaseVideo.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await ShowcaseVideo.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
