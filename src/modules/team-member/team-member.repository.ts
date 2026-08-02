import AppQueryFind from '../../builder/app-query-find';
import { TeamMember } from './team-member.model';
import { TTeamMember, TTeamMemberDocument } from './team-member.type';

export const create = async (
  data: Partial<TTeamMember>,
): Promise<TTeamMember> => {
  const result = await TeamMember.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TTeamMemberDocument | null> => {
  return await TeamMember.findById(id);
};

export const findByIdLean = async (id: string): Promise<TTeamMember | null> => {
  return await TeamMember.findById(id).lean();
};

export const findPublic = async (): Promise<TTeamMember[]> => {
  return await TeamMember.find({ is_active: true })
    .sort({ order: 1, created_at: -1 })
    .lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTeamMember[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  if (qp.filter === 'active') qp.is_active = true;
  else if (qp.filter === 'inactive') qp.is_active = false;

  const q = new AppQueryFind(TeamMember, qp)
    .search(['name', 'role'])
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
  payload: Partial<TTeamMember>,
): Promise<TTeamMemberDocument | null> => {
  return await TeamMember.findByIdAndUpdate(id, payload, {
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
  await TeamMember.bulkWrite(ops);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await TeamMember.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await TeamMember.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TTeamMemberDocument | null> => {
  return await TeamMember.findById(id).setOptions({ bypassDeleted: true });
};

/** Clears the soft-delete marker. Returns null when the row was not deleted. */
export const restoreById = async (
  id: string,
): Promise<TTeamMemberDocument | null> => {
  return await TeamMember.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, $unset: { deleted_at: 1 } },
    { new: true },
  ).setOptions({ bypassDeleted: true });
};
