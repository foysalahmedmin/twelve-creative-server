import AppQueryFind from '../../builder/app-query-find';
import { Insight } from './insight.model';
import { TInsight, TInsightDocument } from './insight.type';

export const create = async (data: Partial<TInsight>): Promise<TInsight> => {
  const result = await Insight.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TInsightDocument | null> => {
  return await Insight.findById(id);
};

export const findByIdLean = async (id: string): Promise<TInsight | null> => {
  return await Insight.findById(id).lean();
};

export const findBySlugLean = async (slug: string): Promise<TInsight | null> => {
  return await Insight.findOne({ slug, status: 'published' }).lean();
};

export const findPublicList = async (): Promise<TInsight[]> => {
  return await Insight.find({ status: 'published' })
    .sort({ published_at: -1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TInsight[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const q = new AppQueryFind(Insight, query)
    .search(['title', 'slug', 'excerpt', 'category'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((c) => c.lean());
  return await q.execute([
    { key: 'published', filter: { status: 'published' } },
    { key: 'draft', filter: { status: 'draft' } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TInsight>,
): Promise<TInsightDocument | null> => {
  // We can't use findByIdAndUpdate because save hooks need to run for
  // read_minutes + published_at auto-derivation.
  const doc = await Insight.findById(id);
  if (!doc) return null;
  Object.assign(doc, payload);
  await doc.save();
  return doc;
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Insight.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Insight.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
