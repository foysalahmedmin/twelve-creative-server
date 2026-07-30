import { Task } from './task.model';
import { TTask, TTaskDocument } from './task.type';

export const create = async (data: Partial<TTask>): Promise<TTask> => {
  const result = await Task.create(data);
  return result.toObject();
};

export const findAll = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTask[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.search) filter.title = { $regex: query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Task.find(filter)
      .sort({ due_date: 1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    // countDocuments bypasses the schema's pre(/^find/) soft-delete filter
    // (it isn't a "find*" op), so is_deleted must be applied explicitly here
    // to match the rows actually returned above.
    Task.countDocuments({ ...filter, is_deleted: { $ne: true } }),
  ]);

  return {
    data: data as TTask[],
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

export const findById = async (id: string): Promise<TTaskDocument | null> => {
  return await Task.findById(id);
};

export const findByIdLean = async (id: string): Promise<TTask | null> => {
  return await Task.findById(id).lean();
};

export const updateById = async (
  id: string,
  payload: Partial<TTask>,
): Promise<TTaskDocument | null> => {
  return await Task.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Task.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};
