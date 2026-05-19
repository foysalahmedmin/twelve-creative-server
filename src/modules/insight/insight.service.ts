import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { Insight } from './insight.model';
import * as InsightRepository from './insight.repository';
import { TInsight } from './insight.type';

const ensureSlugUnique = async (
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await Insight.findOne({ slug });
  if (existing && existing._id.toString() !== excludeId) {
    throw new AppError(
      httpStatus.CONFLICT,
      `An insight with slug "${slug}" already exists`,
    );
  }
};

export const createInsight = async (
  data: Partial<TInsight>,
): Promise<TInsight> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  return await InsightRepository.create(data);
};

export const getPublicInsights = async (): Promise<{ data: TInsight[] }> => {
  const data = await InsightRepository.findPublicList();
  return { data };
};

export const getPublicInsightBySlug = async (
  slug: string,
): Promise<TInsight> => {
  const result = await InsightRepository.findBySlugLean(slug);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Insight not found');
  }
  return result;
};

export const getInsights = async (
  query: Record<string, unknown>,
): Promise<{
  data: TInsight[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await InsightRepository.findAdminPaginated(query);
};

export const getInsight = async (id: string): Promise<TInsight> => {
  const result = await InsightRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Insight not found');
  return result;
};

export const updateInsight = async (
  id: string,
  payload: Partial<TInsight>,
): Promise<TInsight> => {
  const exists = await InsightRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Insight not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const result = await InsightRepository.updateById(id, payload);
  return result!.toObject();
};

export const deleteInsight = async (id: string): Promise<void> => {
  const doc = await InsightRepository.findById(id);
  if (!doc) throw new AppError(httpStatus.NOT_FOUND, 'Insight not found');
  await doc.softDelete();
};

export const deleteInsightPermanent = async (id: string): Promise<void> => {
  const exists = await InsightRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Insight not found');
  await InsightRepository.hardDeleteById(id);
};
