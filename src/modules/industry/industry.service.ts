import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as FeaturedProjectRepository from '../featured-project/featured-project.repository';
import * as ShowcaseVideoRepository from '../showcase-video/showcase-video.repository';
import { Industry } from './industry.model';
import * as IndustryRepository from './industry.repository';
import { TIndustry, TIndustryOption } from './industry.type';

const ensureSlugUnique = async (
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await Industry.findOne({ slug });
  if (existing && existing._id.toString() !== excludeId) {
    throw new AppError(
      httpStatus.CONFLICT,
      `An industry with slug "${slug}" already exists`,
    );
  }
};

const ensureIndustryHasNoReferences = async (id: string): Promise<void> => {
  const [featuredProjects, showcaseVideos] = await Promise.all([
    FeaturedProjectRepository.countByIndustry(id),
    ShowcaseVideoRepository.countByIndustry(id),
  ]);

  if (featuredProjects > 0 || showcaseVideos > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Industry is referenced by ${featuredProjects} featured project(s) and ${showcaseVideos} showcase video(s). Reassign or permanently delete those records first.`,
    );
  }
};

export const createIndustry = async (
  data: Partial<TIndustry>,
): Promise<TIndustry> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  return await IndustryRepository.create(data);
};

export const getPublicIndustries = async (): Promise<{
  data: TIndustry[];
}> => {
  const data = await IndustryRepository.findPublic();
  return { data };
};

export const getIndustryOptions = async (): Promise<TIndustryOption[]> => {
  return await IndustryRepository.findOptions();
};

export const getIndustries = async (
  query: Record<string, unknown>,
): Promise<{
  data: TIndustry[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await IndustryRepository.findAdminPaginated(query);
};

export const getIndustry = async (id: string): Promise<TIndustry> => {
  const result = await IndustryRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  return result;
};

export const updateIndustry = async (
  id: string,
  payload: Partial<TIndustry>,
): Promise<TIndustry> => {
  const exists = await IndustryRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const result = await IndustryRepository.updateById(id, payload);
  return result!;
};

export const reorderIndustries = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await IndustryRepository.updateOrder(items);
};

export const deleteIndustry = async (id: string): Promise<void> => {
  const industry = await IndustryRepository.findById(id);
  if (!industry) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureIndustryHasNoReferences(id);
  await industry.softDelete();
};

export const deleteIndustryPermanent = async (id: string): Promise<void> => {
  const exists = await IndustryRepository.findByIdWithDeletedLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureIndustryHasNoReferences(id);
  await IndustryRepository.hardDeleteById(id);
};

export const restoreIndustry = async (id: string): Promise<TIndustry> => {
  const exists = await IndustryRepository.findByIdWithDeletedLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureSlugUnique(exists.slug, id);

  const result = await IndustryRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Industry not found or not deleted',
    );
  }
  return result;
};
