import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as ShowcaseVideoRepository from './showcase-video.repository';
import { TShowcaseVideo } from './showcase-video.type';

export const createShowcaseVideo = async (
  data: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideo> => {
  return await ShowcaseVideoRepository.create(data);
};

export const getPublicShowcaseVideos = async (
  aspect?: 'reel' | 'landscape',
): Promise<{
  data: TShowcaseVideo[];
}> => {
  const data = await ShowcaseVideoRepository.findPublic(aspect);
  return { data };
};

export const getShowcaseVideos = async (
  query: Record<string, unknown>,
): Promise<{
  data: TShowcaseVideo[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await ShowcaseVideoRepository.findAdminPaginated(query);
};

export const getShowcaseVideo = async (
  id: string,
): Promise<TShowcaseVideo> => {
  const result = await ShowcaseVideoRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  return result;
};

export const updateShowcaseVideo = async (
  id: string,
  payload: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideo> => {
  const exists = await ShowcaseVideoRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  const result = await ShowcaseVideoRepository.updateById(id, payload);
  return result!;
};

export const reorderShowcaseVideos = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await ShowcaseVideoRepository.updateOrder(items);
};

export const deleteShowcaseVideo = async (id: string): Promise<void> => {
  const video = await ShowcaseVideoRepository.findById(id);
  if (!video) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  await video.softDelete();
};

export const deleteShowcaseVideoPermanent = async (
  id: string,
): Promise<void> => {
  const exists = await ShowcaseVideoRepository.findByIdWithDeleted(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  await ShowcaseVideoRepository.hardDeleteById(id);
};

export const restoreShowcaseVideo = async (
  id: string,
): Promise<TShowcaseVideo> => {
  const result = await ShowcaseVideoRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Showcase video not found or not deleted',
    );
  }
  return result;
};
