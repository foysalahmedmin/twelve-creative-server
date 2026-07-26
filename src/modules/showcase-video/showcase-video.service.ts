import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  isSafeImageReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import * as IndustryRepository from '../industry/industry.repository';
import * as ShowcaseVideoRepository from './showcase-video.repository';
import { TShowcaseVideo, TShowcaseVideoPopulated } from './showcase-video.type';

const getIndustryId = (
  industry: TShowcaseVideo['industry'] | undefined,
): string => industry?.toString() ?? '';

const ensureIndustryExists = async (
  industry: TShowcaseVideo['industry'] | undefined,
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

const ensureRenderableThumbnail = (
  video: TShowcaseVideo['video'] | undefined,
  thumbnail: string | undefined,
): void => {
  if (video?.source !== 'youtube' && !thumbnail?.trim()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Thumbnail is required for URL and uploaded showcase videos',
    );
  }
};

const ensureRenderableMedia = (
  video: TShowcaseVideo['video'] | undefined,
  thumbnail: string | undefined,
): void => {
  if (!video || !isSafeVideoReference(video.source, video.value)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Showcase video reference is invalid',
    );
  }

  if (
    thumbnail !== undefined &&
    (typeof thumbnail !== 'string' ||
      (thumbnail.trim() && !isSafeImageReference(thumbnail)))
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Showcase video thumbnail reference is invalid',
    );
  }

  ensureRenderableThumbnail(video, thumbnail);
};

export const createShowcaseVideo = async (
  data: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideoPopulated> => {
  const industry = await ensureIndustryExists(data.industry);
  ensureRenderableMedia(data.video, data.thumbnail);
  const created = await ShowcaseVideoRepository.create({ ...data, industry });
  return (await ShowcaseVideoRepository.findByIdLean(created._id.toString()))!;
};

export const getPublicShowcaseVideos = async (
  query: {
    aspect?: 'reel' | 'landscape';
    industry_slug?: string;
  } = {},
): Promise<{
  data: TShowcaseVideoPopulated[];
}> => {
  const data = await ShowcaseVideoRepository.findPublic({
    aspect: query.aspect,
    industry_slug: query.industry_slug?.trim().toLowerCase(),
  });
  return { data };
};

export const getShowcaseVideos = async (
  query: Record<string, unknown>,
): Promise<{
  data: TShowcaseVideoPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await ShowcaseVideoRepository.findAdminPaginated(query);
};

export const getShowcaseVideo = async (
  id: string,
): Promise<TShowcaseVideoPopulated> => {
  const result = await ShowcaseVideoRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  return result;
};

export const updateShowcaseVideo = async (
  id: string,
  payload: Partial<TShowcaseVideo>,
): Promise<TShowcaseVideoPopulated> => {
  const exists = await ShowcaseVideoRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  const nextPayload = { ...payload };
  if (payload.industry !== undefined) {
    nextPayload.industry = await ensureIndustryExists(payload.industry);
  }
  ensureRenderableMedia(
    payload.video ?? exists.video,
    payload.thumbnail ?? exists.thumbnail,
  );
  await ShowcaseVideoRepository.updateById(id, nextPayload);
  return (await ShowcaseVideoRepository.findByIdLean(id))!;
};

export const reorderShowcaseVideos = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  const ids = [...new Set(items.map((item) => item._id))];
  if (ids.length !== items.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Showcase video reorder items must be unique',
    );
  }

  const records = await ShowcaseVideoRepository.findReorderRecords(ids);
  if (records.length !== ids.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'One or more showcase videos were not found',
    );
  }

  const groups = new Set(
    records.map((record) => `${record.industry.toString()}:${record.aspect}`),
  );
  if (groups.size !== 1) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Showcase videos can only be reordered within one industry and aspect',
    );
  }

  const first = records[0];
  await ShowcaseVideoRepository.updateOrder(
    items,
    first.industry.toString(),
    first.aspect,
  );
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
): Promise<TShowcaseVideoPopulated> => {
  const exists = await ShowcaseVideoRepository.findByIdWithDeleted(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Showcase video not found');
  }
  await ensureIndustryExists(exists.industry);
  ensureRenderableMedia(exists.video, exists.thumbnail);

  const restored = await ShowcaseVideoRepository.restoreById(id);
  if (!restored) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Showcase video not found or not deleted',
    );
  }
  return (await ShowcaseVideoRepository.findByIdLean(id))!;
};
