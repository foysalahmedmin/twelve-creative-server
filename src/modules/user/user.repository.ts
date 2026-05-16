/**
 * User Repository
 *
 * Handles ALL direct database interactions for the User module.
 * The service layer must NEVER import from `user.model` directly;
 * it must go through this repository. This ensures:
 *  - Loose coupling between business logic and data access
 *  - Mockable DB layer for unit testing
 *  - A single place to change if the persistence layer changes
 */

import AppQueryFind from '../../builder/app-query-find';
import { User } from './user.model';
import { TUser, TUserDocument } from './user.type';

// ─── Find One ────────────────────────────────────────────────────────────────

export const findById = async (id: string): Promise<TUserDocument | null> => {
  return await User.findById(id);
};

export const findByIdLean = async (id: string): Promise<TUser | null> => {
  return await User.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TUserDocument | null> => {
  return await User.findById(id).setOptions({ bypassDeleted: true });
};

export const findByEmail = async (email: string): Promise<TUser | null> => {
  return await User.findOne({ email }).lean();
};

/**
 * Returns the user with password + password_changed_at selected
 * (needed by auth flows: signin, refresh-token, change-password, etc.)
 */
export const findByEmailWithPassword = async (
  email: string,
): Promise<TUserDocument | null> => {
  return await User.isUserExistByEmail(email);
};

export const findByGoogleIdWithPassword = async (
  googleId: string,
): Promise<TUserDocument | null> => {
  return (await User.findOne({ google_id: googleId }).select(
    '+password +token_version',
  )) as TUserDocument | null;
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createUser = async (
  data: Partial<TUser>,
): Promise<TUserDocument> => {
  return await User.create(data);
};

// ─── Auth-specific Updates ────────────────────────────────────────────────────

export const updatePasswordByEmailAndRole = async (
  email: string,
  role: string,
  hashedPassword: string,
): Promise<TUserDocument | null> => {
  return await User.findOneAndUpdate(
    { email, role },
    {
      $set: { password: hashedPassword, password_changed_at: new Date() },
      $inc: { token_version: 1 },
    },
    { new: true, runValidators: true },
  );
};

export const updatePasswordById = async (
  id: string,
  hashedPassword: string,
): Promise<TUserDocument | null> => {
  return await User.findByIdAndUpdate(
    id,
    {
      $set: { password: hashedPassword, password_changed_at: new Date() },
      $inc: { token_version: 1 },
    },
    { new: true, runValidators: true },
  );
};

export const incrementTokenVersion = async (id: string): Promise<void> => {
  await User.findByIdAndUpdate(id, { $inc: { token_version: 1 } });
};

export const updateIsVerifiedById = async (
  id: string,
): Promise<TUserDocument | null> => {
  return await User.findByIdAndUpdate(
    id,
    { is_verified: true },
    { new: true, runValidators: true },
  );
};

export const saveDocument = async (
  doc: TUserDocument,
): Promise<TUserDocument> => {
  return await doc.save();
};

// ─── Find Many ────────────────────────────────────────────────────────────────

export const findMany = async (
  filter: Record<string, unknown>,
): Promise<TUser[]> => {
  return await User.find(filter).lean();
};

export const findManyByIds = async (ids: string[]): Promise<TUser[]> => {
  return await User.find({ _id: { $in: ids } }).lean();
};

// ─── Paginated Lists ─────────────────────────────────────────────────────────

export const findWritersPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const userQuery = new AppQueryFind(User, {
    role: { $in: ['admin', 'editor'] },
    ...query,
  })
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await userQuery.execute();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const userQuery = new AppQueryFind(User, query)
    .search(['name', 'email', 'image'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await userQuery.execute([
    { key: 'active', filter: { status: 'in-progress' } },
    { key: 'blocked', filter: { status: 'blocked' } },
    { key: 'verified', filter: { is_verified: true } },
  ]);
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateById = async (
  id: string,
  payload: Partial<TUser>,
): Promise<TUserDocument | null> => {
  return await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateManyByIds = async (
  ids: string[],
  payload: Partial<TUser>,
): Promise<{ modifiedCount: number }> => {
  return await User.updateMany({ _id: { $in: ids } }, { ...payload });
};

export const restoreById = async (
  id: string,
): Promise<TUserDocument | null> => {
  return await User.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );
};

export const restoreManyByIds = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await User.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};

export const findRestoredByIds = async (ids: string[]): Promise<TUser[]> => {
  return await User.find({ _id: { $in: ids } }).lean();
};

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export const softDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await User.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

// ─── Hard Delete ──────────────────────────────────────────────────────────────

export const hardDeleteById = async (id: string): Promise<void> => {
  await User.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const hardDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await User.deleteMany({ _id: { $in: ids } }).setOptions({
    bypassDeleted: true,
  });
};
