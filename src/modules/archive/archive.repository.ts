import AppQueryFind from '../../builder/app-query-find';
import { Archive } from './archive.model';
import { TPost, TPostDocument } from './archive.type';

export const create = async (data: Partial<TPost>): Promise<TPost> => {
  const result = await Archive.create(data);
  return result.toObject();
};

export const findById = async (id: string): Promise<TPostDocument | null> => {
  return await Archive.findById(id).populate([
    { path: 'thumbnail' },
    { path: 'video' },
    { path: 'categories', select: 'name icon status' },
    { path: 'user', select: 'name email' },
  ]);
};

export const findPublicById = async (id: string): Promise<TPost | null> => {
  return await Archive.findOne({
    _id: id,
    status: 'active',
    is_deleted: { $ne: true },
  })
    .populate([
      {
        path: 'thumbnail',
        select: 'name url mimetype size caption',
        match: { status: 'active', is_deleted: { $ne: true } },
      },
      {
        path: 'video',
        select: 'name url mimetype size caption',
        match: { status: 'active', is_deleted: { $ne: true } },
      },
      {
        path: 'categories',
        select: 'name icon',
        match: { status: 'active', is_deleted: { $ne: true } },
      },
      { path: 'user', select: 'name' },
    ])
    .lean();
};

export const findByIdLean = async (id: string): Promise<TPost | null> => {
  return await Archive.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TPost | null> => {
  return await Archive.findById(id).setOptions({ bypassDeleted: true }).lean();
};

export const findPublicPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPost[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const publicQueryParams = { ...query };
  delete publicQueryParams.status;
  delete publicQueryParams.is_deleted;
  delete publicQueryParams.fields;
  delete publicQueryParams.or;
  delete publicQueryParams.and;

  // Public callers may narrow the active set, but can never replace these
  // publication/deletion boundaries or project internal model fields.
  publicQueryParams.status = 'active';
  publicQueryParams.is_deleted = { $ne: true };
  if (!publicQueryParams.sort) publicQueryParams.sort = '-created_at';
  if (!publicQueryParams.page) publicQueryParams.page = '1';
  if (!publicQueryParams.limit) publicQueryParams.limit = '100';

  const archiveQuery = new AppQueryFind(Archive, publicQueryParams)
    .populate([
      {
        path: 'thumbnail',
        select: 'name url mimetype size caption',
        match: { status: 'active', is_deleted: { $ne: true } },
      },
      {
        path: 'categories',
        select: 'name icon',
        match: { status: 'active', is_deleted: { $ne: true } },
      },
      { path: 'user', select: 'name' },
    ])
    .search(['title', 'description', 'tags'])
    .filter([
      'type',
      'is_featured',
      'categories',
      'tags',
      'status',
      'is_deleted',
    ])
    .sort(['created_at', 'title', 'type', 'is_featured'])
    .paginate()
    .fields([
      'title',
      'description',
      'content',
      'thumbnail',
      'video',
      'youtube',
      'tags',
      'categories',
      'user',
      'status',
      'type',
      'ratio',
      'is_featured',
      'created_at',
      'updated_at',
    ])
    .tap((q) => q.lean());
  return await archiveQuery.execute();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPost[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const archiveQuery = new AppQueryFind(Archive, query)
    .populate([
      { path: 'thumbnail' },
      { path: 'categories', select: 'name icon' },
      { path: 'user', select: 'name email' },
    ])
    .search(['title', 'description', 'tags'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());
  return await archiveQuery.execute([
    { key: 'draft', filter: { status: 'draft' } },
    { key: 'active', filter: { status: 'active' } },
    { key: 'archived', filter: { status: 'archived' } },
    { key: 'featured', filter: { is_featured: true } },
  ]);
};

export const updateById = async (
  id: string,
  payload: Partial<TPost>,
): Promise<TPostDocument | null> => {
  return await Archive.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Archive.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const restoreById = async (
  id: string,
): Promise<TPostDocument | null> => {
  return await Archive.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Archive.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
