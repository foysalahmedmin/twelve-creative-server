import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as WorkRepository from './work.repository';
import { Work } from './work.model';
import { TWork } from './work.type';

const ensureSlugUnique = async (
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await Work.findOne({ slug });
  if (existing && existing._id.toString() !== excludeId) {
    throw new AppError(
      httpStatus.CONFLICT,
      `A work with slug "${slug}" already exists`,
    );
  }
};

export const createWork = async (data: Partial<TWork>): Promise<TWork> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  return await WorkRepository.create(data);
};

export const getPublicWorks = async (): Promise<{ data: TWork[] }> => {
  const data = await WorkRepository.findPublicList();
  return { data };
};

export const getPublicWorkBySlug = async (slug: string): Promise<TWork> => {
  const result = await WorkRepository.findBySlugLean(slug);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  }
  return result;
};

export const getWorks = async (
  query: Record<string, unknown>,
): Promise<{
  data: TWork[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await WorkRepository.findAdminPaginated(query);
};

export const getWork = async (id: string): Promise<TWork> => {
  const result = await WorkRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  return result;
};

export const updateWork = async (
  id: string,
  payload: Partial<TWork>,
): Promise<TWork> => {
  const exists = await WorkRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const result = await WorkRepository.updateById(id, payload);
  return result!;
};

export const reorderWorks = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await WorkRepository.updateOrder(items);
};

export const deleteWork = async (id: string): Promise<void> => {
  const work = await WorkRepository.findById(id);
  if (!work) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  await work.softDelete();
};

export const deleteWorkPermanent = async (id: string): Promise<void> => {
  const exists = await WorkRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  await WorkRepository.hardDeleteById(id);
};
