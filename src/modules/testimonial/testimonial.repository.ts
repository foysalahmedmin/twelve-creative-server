import AppQueryFind from '../../builder/app-query-find';
import * as IndustryRepository from '../industry/industry.repository';
import { Testimonial } from './testimonial.model';
import {
  TTestimonial,
  TTestimonialDocument,
  TTestimonialPopulated,
} from './testimonial.type';

export type TTestimonialUnsetField = 'message' | 'video_message' | 'thumbnail';

const INDUSTRY_POPULATE = {
  path: 'industry',
  select: '_id name slug order is_active',
};

export const create = async (
  data: Partial<TTestimonial>,
): Promise<TTestimonialDocument> => {
  return await Testimonial.create(data);
};

export const findById = async (
  id: string,
): Promise<TTestimonialDocument | null> => {
  return await Testimonial.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TTestimonialPopulated | null> => {
  return (await Testimonial.findById(id)
    .populate(INDUSTRY_POPULATE)
    .lean()) as TTestimonialPopulated | null;
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TTestimonial | null> => {
  return await Testimonial.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPublic = async (
  industrySlug?: string,
): Promise<TTestimonialPopulated[]> => {
  const industryIds = await IndustryRepository.findActiveIds(industrySlug);
  if (!industryIds.length) return [];

  return (await Testimonial.find({
    is_active: true,
    industry: { $in: industryIds },
  })
    .populate(INDUSTRY_POPULATE)
    .sort({ order: 1, created_at: -1 })
    .lean()) as unknown as TTestimonialPopulated[];
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTestimonialPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q: Record<string, unknown> = { ...query };
  if (q.filter === 'active') q.is_active = true;
  else if (q.filter === 'inactive') q.is_active = false;
  if (!q.sort) q.sort = 'order';

  const testimonialQuery = new AppQueryFind(Testimonial, q)
    .search(['name', 'designation', 'message'])
    .filter(['industry', 'category', 'is_active'])
    .sort(['order', 'name', 'category', 'is_active'])
    .paginate()
    .fields()
    .populate(INDUSTRY_POPULATE)
    .tap((q) => q.lean());

  return (await testimonialQuery.execute([
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ])) as unknown as {
    data: TTestimonialPopulated[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  };
};

export const updateById = async (
  id: string,
  payload: Partial<TTestimonial>,
  unsetFields: TTestimonialUnsetField[] = [],
): Promise<TTestimonialDocument | null> => {
  const update = unsetFields.length
    ? {
        $set: payload,
        $unset: Object.fromEntries(unsetFields.map((field) => [field, 1])),
      }
    : payload;

  return await Testimonial.findByIdAndUpdate(id, update, {
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
  await Testimonial.bulkWrite(ops);
};

export const countExistingByIds = async (ids: string[]): Promise<number> => {
  return await Testimonial.countDocuments({
    _id: { $in: ids },
    is_deleted: { $ne: true },
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Testimonial.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const restoreById = async (
  id: string,
): Promise<TTestimonialDocument | null> => {
  return await Testimonial.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Testimonial.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const countByIndustry = async (industry: string): Promise<number> => {
  return await Testimonial.countDocuments({ industry });
};
