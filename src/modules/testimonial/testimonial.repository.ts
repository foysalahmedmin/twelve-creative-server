import AppQueryFind from '../../builder/app-query-find';
import { Testimonial } from './testimonial.model';
import { TTestimonial, TTestimonialDocument } from './testimonial.type';

export const create = async (
  data: Partial<TTestimonial>,
): Promise<TTestimonial> => {
  const result = await Testimonial.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TTestimonialDocument | null> => {
  return await Testimonial.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TTestimonial | null> => {
  return await Testimonial.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TTestimonial | null> => {
  return await Testimonial.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPublic = async (): Promise<TTestimonial[]> => {
  return await Testimonial.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTestimonial[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q: Record<string, unknown> = { ...query };
  if (q.filter === 'active') q.is_active = true;
  else if (q.filter === 'inactive') q.is_active = false;

  const testimonialQuery = new AppQueryFind(Testimonial, q)
    .search(['name', 'designation', 'message'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await testimonialQuery.execute([
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TTestimonial>,
): Promise<TTestimonialDocument | null> => {
  return await Testimonial.findByIdAndUpdate(id, payload, {
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
