import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  generateCacheKey,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import * as CategoryRepository from './category.repository';
import { TCategory } from './category.type';

const CACHE_PREFIX = 'category';
const CACHE_TTL = 3600;

export const createCategory = async (data: Partial<TCategory>): Promise<TCategory> => {
  const result = await CategoryRepository.create(data);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};

export const getPublicCategories = async (
  query: Record<string, unknown>,
): Promise<{ data: TCategory[]; meta: { total: number; page: number; limit: number } }> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['public', 'list', query]);
  return await withCache(cacheKey, CACHE_TTL, () =>
    CategoryRepository.findPublicPaginated(query),
  );
};

export const getCategories = async (
  query: Record<string, unknown>,
): Promise<{ data: TCategory[]; meta: { total: number; page: number; limit: number } }> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['list', query]);
  return await withCache(cacheKey, CACHE_TTL, () =>
    CategoryRepository.findAdminPaginated(query),
  );
};

export const getCategory = async (id: string): Promise<TCategory> => {
  return await withCache(`${CACHE_PREFIX}:id:${id}`, CACHE_TTL, async () => {
    const result = await CategoryRepository.findByIdLean(id);
    if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    return result;
  });
};

export const updateCategory = async (
  id: string,
  payload: Partial<TCategory>,
): Promise<TCategory> => {
  const exists = await CategoryRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  const result = await CategoryRepository.updateById(id, payload);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result!;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const category = await CategoryRepository.findById(id);
  if (!category) throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  await category.softDelete();
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
};

export const deleteCategoryPermanent = async (id: string): Promise<void> => {
  const category = await CategoryRepository.findByIdWithDeleted(id);
  if (!category) throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  await CategoryRepository.hardDeleteById(id);
};

export const restoreCategory = async (id: string): Promise<TCategory> => {
  const result = await CategoryRepository.restoreById(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found or not deleted');
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};
