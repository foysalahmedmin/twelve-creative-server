import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as FeaturedProjectRepository from './featured-project.repository';
import { TFeaturedProject } from './featured-project.type';

export const createFeaturedProject = async (
  data: Partial<TFeaturedProject>,
): Promise<TFeaturedProject> => {
  return await FeaturedProjectRepository.create(data);
};

export const getPublicFeaturedProjects = async (): Promise<{
  data: TFeaturedProject[];
}> => {
  const data = await FeaturedProjectRepository.findPublic();
  return { data };
};

export const getFeaturedProjects = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturedProject[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await FeaturedProjectRepository.findAdminPaginated(query);
};

export const getFeaturedProject = async (
  id: string,
): Promise<TFeaturedProject> => {
  const result = await FeaturedProjectRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  return result;
};

export const updateFeaturedProject = async (
  id: string,
  payload: Partial<TFeaturedProject>,
): Promise<TFeaturedProject> => {
  const exists = await FeaturedProjectRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  const result = await FeaturedProjectRepository.updateById(id, payload);
  return result!;
};

export const reorderFeaturedProjects = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await FeaturedProjectRepository.updateOrder(items);
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
  const exists = await FeaturedProjectRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Featured project not found');
  }
  await FeaturedProjectRepository.hardDeleteById(id);
};
