import httpStatus from 'http-status';

jest.mock('../archive.repository');
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(),
  invalidateCacheByPattern: jest.fn(),
  withCache: jest.fn(),
}));

import * as CacheUtils from '../../../utils/cache.utils';
import * as ArchiveRepository from '../archive.repository';
import * as ArchiveService from '../archive.service';

const POST_ID = '507f1f77bcf86cd799439011';
const post = {
  _id: POST_ID,
  title: 'A useful post',
  content: 'Post content',
  type: 'video' as const,
  status: 'active' as const,
  user: '507f1f77bcf86cd799439012',
  is_deleted: false,
};
const page = {
  data: [post],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('ArchiveService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (CacheUtils.generateCacheKey as jest.Mock).mockImplementation(
      (prefix: string, parts: unknown[]) =>
        `${prefix}:${JSON.stringify(parts)}`,
    );
    (CacheUtils.withCache as jest.Mock).mockImplementation(
      (_key: string, _ttl: number, load: () => Promise<unknown>) => load(),
    );
    (CacheUtils.invalidateCacheByPattern as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  it('creates a post and invalidates archive caches', async () => {
    (ArchiveRepository.create as jest.Mock).mockResolvedValue(post);

    await expect(ArchiveService.createPost(post as any)).resolves.toBe(post);

    expect(ArchiveRepository.create).toHaveBeenCalledWith(post);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'archive:*',
    );
  });

  it('returns the cached public post page', async () => {
    const query = { page: 1, search: 'useful' };
    (ArchiveRepository.findPublicPaginated as jest.Mock).mockResolvedValue(
      page,
    );

    await expect(ArchiveService.getPublicPosts(query)).resolves.toEqual(page);

    expect(CacheUtils.generateCacheKey).toHaveBeenCalledWith('archive', [
      'public',
      'list',
      query,
    ]);
    expect(ArchiveRepository.findPublicPaginated).toHaveBeenCalledWith(query);
  });

  it('returns the cached admin post page', async () => {
    const query = { filter: 'draft' };
    (ArchiveRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(ArchiveService.getPosts(query)).resolves.toEqual(page);

    expect(CacheUtils.generateCacheKey).toHaveBeenCalledWith('archive', [
      'list',
      query,
    ]);
    expect(ArchiveRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns a post by id through the cache wrapper', async () => {
    (ArchiveRepository.findById as jest.Mock).mockResolvedValue(post);

    await expect(ArchiveService.getPost(POST_ID)).resolves.toBe(post);

    expect(CacheUtils.withCache).toHaveBeenCalledWith(
      `archive:id:${POST_ID}`,
      3600,
      expect.any(Function),
    );
  });

  it('throws 404 when a requested post does not exist', async () => {
    (ArchiveRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(ArchiveService.getPost(POST_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Post not found',
    });
  });

  it('updates an existing post and invalidates archive caches', async () => {
    const payload = { title: 'Updated post' };
    const updated = { ...post, ...payload };
    (ArchiveRepository.findByIdLean as jest.Mock).mockResolvedValue(post);
    (ArchiveRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(ArchiveService.updatePost(POST_ID, payload)).resolves.toEqual(
      updated,
    );

    expect(ArchiveRepository.updateById).toHaveBeenCalledWith(POST_ID, payload);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'archive:*',
    );
  });

  it('rejects an update when the post does not exist', async () => {
    (ArchiveRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      ArchiveService.updatePost(POST_ID, { title: 'Updated post' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(ArchiveRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft deletes an existing post and invalidates archive caches', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (ArchiveRepository.findById as jest.Mock).mockResolvedValue({
      ...post,
      softDelete,
    });

    await ArchiveService.deletePost(POST_ID);

    expect(softDelete).toHaveBeenCalledTimes(1);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'archive:*',
    );
  });

  it('rejects a soft delete when the post does not exist', async () => {
    (ArchiveRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(ArchiveService.deletePost(POST_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('permanently deletes a post found through the with-deleted lookup', async () => {
    (ArchiveRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      post,
    );

    await ArchiveService.deletePostPermanent(POST_ID);

    expect(ArchiveRepository.hardDeleteById).toHaveBeenCalledWith(POST_ID);
  });

  it('rejects permanent deletion when the post does not exist', async () => {
    (ArchiveRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      ArchiveService.deletePostPermanent(POST_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(ArchiveRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('restores a deleted post and invalidates archive caches', async () => {
    (ArchiveRepository.restoreById as jest.Mock).mockResolvedValue(post);

    await expect(ArchiveService.restorePost(POST_ID)).resolves.toBe(post);

    expect(ArchiveRepository.restoreById).toHaveBeenCalledWith(POST_ID);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'archive:*',
    );
  });

  it('throws 404 when the post cannot be restored', async () => {
    (ArchiveRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(ArchiveService.restorePost(POST_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Post not found or not deleted',
    });
  });
});
