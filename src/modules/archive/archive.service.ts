import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  generateCacheKey,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import * as ArchiveRepository from './archive.repository';
import { TPost } from './archive.type';

const CACHE_PREFIX = 'archive';
const CACHE_TTL = 3600;

export const createPost = async (data: Partial<TPost>): Promise<TPost> => {
  const result = await ArchiveRepository.create(data);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};

export const getPublicPosts = async (
  query: Record<string, unknown>,
): Promise<{ data: TPost[]; meta: { total: number; page: number; limit: number } }> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['public', 'list', query]);
  return await withCache(cacheKey, CACHE_TTL, () =>
    ArchiveRepository.findPublicPaginated(query),
  );
};

export const getPosts = async (
  query: Record<string, unknown>,
): Promise<{ data: TPost[]; meta: { total: number; page: number; limit: number } }> => {
  const cacheKey = generateCacheKey(CACHE_PREFIX, ['list', query]);
  return await withCache(cacheKey, CACHE_TTL, () =>
    ArchiveRepository.findAdminPaginated(query),
  );
};

export const getPost = async (id: string): Promise<TPost> => {
  return await withCache(`${CACHE_PREFIX}:id:${id}`, CACHE_TTL, async () => {
    const result = await ArchiveRepository.findById(id);
    if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
    return result;
  });
};

export const updatePost = async (
  id: string,
  payload: Partial<TPost>,
): Promise<TPost> => {
  const exists = await ArchiveRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
  const result = await ArchiveRepository.updateById(id, payload);
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result!;
};

export const deletePost = async (id: string): Promise<void> => {
  const post = await ArchiveRepository.findById(id);
  if (!post) throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
  await post.softDelete();
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
};

export const deletePostPermanent = async (id: string): Promise<void> => {
  const post = await ArchiveRepository.findByIdWithDeleted(id);
  if (!post) throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
  await ArchiveRepository.hardDeleteById(id);
};

export const restorePost = async (id: string): Promise<TPost> => {
  const result = await ArchiveRepository.restoreById(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Post not found or not deleted');
  await invalidateCacheByPattern(`${CACHE_PREFIX}:*`);
  return result;
};
