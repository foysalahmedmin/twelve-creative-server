import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as IndustryRepository from '../industry/industry.repository';
import * as WorkRepository from './work.repository';
import { Work } from './work.model';
import { TWork, TWorkPopulated } from './work.type';

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

const ensureIndustryExists = async (
  industry: TWork['industry'] | undefined,
): Promise<string> => {
  const industryId = industry?.toString() ?? '';
  if (!industryId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Industry is required');
  }
  const exists = await IndustryRepository.findByIdLean(industryId);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  }
  return industryId;
};

export const createWork = async (
  data: Partial<TWork>,
): Promise<TWorkPopulated> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  const industry = await ensureIndustryExists(data.industry);
  const created = await WorkRepository.create({ ...data, industry });
  return (await WorkRepository.findByIdLean(created._id.toString()))!;
};

export const getPublicWorks = async (
  query: { industry_slug?: string } = {},
): Promise<{ data: TWorkPopulated[] }> => {
  const data = await WorkRepository.findPublicList(
    query.industry_slug?.trim().toLowerCase(),
  );
  return { data };
};

export const getPublicWorkBySlug = async (
  slug: string,
): Promise<TWorkPopulated> => {
  const result = await WorkRepository.findBySlugLean(slug);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  }
  return result;
};

export const getWorks = async (
  query: Record<string, unknown>,
): Promise<{
  data: TWorkPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await WorkRepository.findAdminPaginated(query);
};

export const getWork = async (id: string): Promise<TWorkPopulated> => {
  const result = await WorkRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  return result;
};

export const updateWork = async (
  id: string,
  payload: Partial<TWork>,
): Promise<TWorkPopulated> => {
  const exists = await WorkRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const nextPayload = { ...payload };
  if (payload.industry !== undefined) {
    nextPayload.industry = await ensureIndustryExists(payload.industry);
  }
  await WorkRepository.updateById(id, nextPayload);
  return (await WorkRepository.findByIdLean(id))!;
};

export const reorderWorks = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  const ids = items.map((item) => item._id);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Work reorder items must be unique',
    );
  }

  if ((await WorkRepository.countExistingByIds(ids)) !== ids.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'One or more works were not found',
    );
  }

  await WorkRepository.updateOrder(items);
};

export const deleteWork = async (id: string): Promise<void> => {
  const work = await WorkRepository.findById(id);
  if (!work) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  await work.softDelete();
};

export const deleteWorkPermanent = async (id: string): Promise<void> => {
  const exists = await WorkRepository.findByIdWithDeletedLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');
  await WorkRepository.hardDeleteById(id);
};

export const restoreWork = async (id: string): Promise<TWorkPopulated> => {
  const exists = await WorkRepository.findByIdWithDeleted(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Work not found');

  const restored = await WorkRepository.restoreById(id);
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'Work not found or not deleted');
  }
  return (await WorkRepository.findByIdLean(id))!;
};
