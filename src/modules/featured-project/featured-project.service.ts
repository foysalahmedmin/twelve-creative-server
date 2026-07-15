import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as IndustryRepository from '../industry/industry.repository';
import * as FeaturedProjectRepository from './featured-project.repository';
import {
  TFeaturedProject,
  TFeaturedProjectPopulated,
} from './featured-project.type';

const getIndustryId = (
  industry: TFeaturedProject['industry'] | undefined,
): string => industry?.toString() ?? '';

const ensureIndustryExists = async (
  industry: TFeaturedProject['industry'] | undefined,
): Promise<string> => {
  const industryId = getIndustryId(industry);
  if (!industryId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Industry is required');
  }

  const exists = await IndustryRepository.findByIdLean(industryId);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  }

  return industryId;
};

export const createFeaturedProject = async (
  data: Partial<TFeaturedProject>,
): Promise<TFeaturedProjectPopulated> => {
  const industry = await ensureIndustryExists(data.industry);
  const created = await FeaturedProjectRepository.create({
    ...data,
    industry,
  });
  return (await FeaturedProjectRepository.findByIdLean(
    created._id.toString(),
  ))!;
};

export const getPublicFeaturedProjects = async (
  query: { industry_slug?: string } = {},
): Promise<{
  data: TFeaturedProjectPopulated[];
}> => {
  const data = await FeaturedProjectRepository.findPublic(
    query.industry_slug?.trim().toLowerCase(),
  );
  return { data };
};

export const getFeaturedProjects = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturedProjectPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await FeaturedProjectRepository.findAdminPaginated(query);
};

export const getFeaturedProject = async (
  id: string,
): Promise<TFeaturedProjectPopulated> => {
  const result = await FeaturedProjectRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  return result;
};

export const updateFeaturedProject = async (
  id: string,
  payload: Partial<TFeaturedProject>,
): Promise<TFeaturedProjectPopulated> => {
  const exists = await FeaturedProjectRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  const nextPayload = { ...payload };
  if (payload.industry !== undefined) {
    nextPayload.industry = await ensureIndustryExists(payload.industry);
  }
  await FeaturedProjectRepository.updateById(id, nextPayload);
  return (await FeaturedProjectRepository.findByIdLean(id))!;
};

export const reorderFeaturedProjects = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  const ids = [...new Set(items.map((item) => item._id))];
  if (ids.length !== items.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Featured project reorder items must be unique',
    );
  }

  const records = await FeaturedProjectRepository.findReorderRecords(ids);
  if (records.length !== ids.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'One or more featured projects were not found',
    );
  }

  const industries = new Set(
    records.map((record) => record.industry.toString()),
  );
  if (industries.size !== 1) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Featured projects can only be reordered within one industry',
    );
  }

  await FeaturedProjectRepository.updateOrder(items, [...industries][0]);
};

export const deleteFeaturedProject = async (id: string): Promise<void> => {
  const project = await FeaturedProjectRepository.findById(id);
  if (!project) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  await project.softDelete();
};

export const deleteFeaturedProjectPermanent = async (
  id: string,
): Promise<void> => {
  const exists = await FeaturedProjectRepository.findByIdWithDeletedLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  await FeaturedProjectRepository.hardDeleteById(id);
};

export const restoreFeaturedProject = async (
  id: string,
): Promise<TFeaturedProjectPopulated> => {
  const exists = await FeaturedProjectRepository.findByIdWithDeletedLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  await ensureIndustryExists(exists.industry);

  const restored = await FeaturedProjectRepository.restoreById(id);
  if (!restored) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Featured project not found or not deleted',
    );
  }

  return (await FeaturedProjectRepository.findByIdLean(id))!;
};
