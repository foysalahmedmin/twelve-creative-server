import AppQueryFind from '../../builder/app-query-find';
import { ShowcaseVideo } from './showcase-video.model';
import { TShowcaseVideo, TShowcaseVideoDocument } from './showcase-video.type';

export const create = async (
  data: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideo> => {
  const result = await ShowcaseVideo.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TShowcaseVideoDocument | null> => {
  return await ShowcaseVideo.findById(id);
};

export const findByIdLean = async (
  id: string,
): Promise<TShowcaseVideo | null> => {
  return await ShowcaseVideo.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TShowcaseVideo | null> => {
  return await ShowcaseVideo.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPublic = async (): Promise<TShowcaseVideo[]> => {
  return await ShowcaseVideo.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TShowcaseVideo[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q = new AppQueryFind(ShowcaseVideo, query)
    .search(['alt'])
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
  payload: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideoDocument | null> => {
  return await ShowcaseVideo.findByIdAndUpdate(id, payload, {
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
  await ShowcaseVideo.bulkWrite(ops);
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
