import httpStatus from 'http-status';

jest.mock('../category.repository');
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(),
  invalidateCacheByPattern: jest.fn(),
  withCache: jest.fn(),
}));

import * as CacheUtils from '../../../utils/cache.utils';
import * as CategoryRepository from '../category.repository';
import * as CategoryService from '../category.service';

const CATEGORY_ID = '507f1f77bcf86cd799439011';
const category = {
  _id: CATEGORY_ID,
  name: 'Branding',
  status: 'active' as const,
  tags: ['strategy'],
  is_featured: true,
};
const page = {
  data: [category],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('CategoryService', () => {
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

  it('creates a category and invalidates category caches', async () => {
    (CategoryRepository.create as jest.Mock).mockResolvedValue(category);

    await expect(CategoryService.createCategory(category)).resolves.toBe(
      category,
    );

    expect(CategoryRepository.create).toHaveBeenCalledWith(category);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'category:*',
    );
  });

  it('returns the cached public category page', async () => {
    const query = { page: 1, search: 'brand' };
    (CategoryRepository.findPublicPaginated as jest.Mock).mockResolvedValue(
      page,
    );

    await expect(CategoryService.getPublicCategories(query)).resolves.toEqual(
      page,
    );

    expect(CacheUtils.generateCacheKey).toHaveBeenCalledWith('category', [
      'public',
      'list',
      query,
    ]);
    expect(CategoryRepository.findPublicPaginated).toHaveBeenCalledWith(query);
  });

  it('returns the cached admin category page', async () => {
    const query = { filter: 'inactive' };
    (CategoryRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      page,
    );

    await expect(CategoryService.getCategories(query)).resolves.toEqual(page);

    expect(CacheUtils.generateCacheKey).toHaveBeenCalledWith('category', [
      'list',
      query,
    ]);
    expect(CategoryRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns a category by id through the cache wrapper', async () => {
    (CategoryRepository.findByIdLean as jest.Mock).mockResolvedValue(category);

    await expect(CategoryService.getCategory(CATEGORY_ID)).resolves.toBe(
      category,
    );

    expect(CacheUtils.withCache).toHaveBeenCalledWith(
      `category:id:${CATEGORY_ID}`,
      3600,
      expect.any(Function),
    );
  });

  it('throws 404 when a requested category does not exist', async () => {
    (CategoryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      CategoryService.getCategory(CATEGORY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Category not found',
    });
  });

  it('updates an existing category and invalidates category caches', async () => {
    const payload = { name: 'Updated category' };
    const updated = { ...category, ...payload };
    (CategoryRepository.findByIdLean as jest.Mock).mockResolvedValue(category);
    (CategoryRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(
      CategoryService.updateCategory(CATEGORY_ID, payload),
    ).resolves.toEqual(updated);

    expect(CategoryRepository.updateById).toHaveBeenCalledWith(
      CATEGORY_ID,
      payload,
    );
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'category:*',
    );
  });

  it('rejects an update when the category does not exist', async () => {
    (CategoryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      CategoryService.updateCategory(CATEGORY_ID, { name: 'Updated category' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(CategoryRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft deletes an existing category and invalidates category caches', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (CategoryRepository.findById as jest.Mock).mockResolvedValue({
      ...category,
      softDelete,
    });

    await CategoryService.deleteCategory(CATEGORY_ID);

    expect(softDelete).toHaveBeenCalledTimes(1);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'category:*',
    );
  });

  it('rejects a soft delete when the category does not exist', async () => {
    (CategoryRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      CategoryService.deleteCategory(CATEGORY_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('permanently deletes a category found through the with-deleted lookup', async () => {
    (CategoryRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      category,
    );

    await CategoryService.deleteCategoryPermanent(CATEGORY_ID);

    expect(CategoryRepository.hardDeleteById).toHaveBeenCalledWith(CATEGORY_ID);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'category:*',
    );
  });

  it('rejects permanent deletion when the category does not exist', async () => {
    (CategoryRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      CategoryService.deleteCategoryPermanent(CATEGORY_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(CategoryRepository.hardDeleteById).not.toHaveBeenCalled();
    expect(CacheUtils.invalidateCacheByPattern).not.toHaveBeenCalled();
  });

  it('restores a deleted category and invalidates category caches', async () => {
    (CategoryRepository.restoreById as jest.Mock).mockResolvedValue(category);

    await expect(CategoryService.restoreCategory(CATEGORY_ID)).resolves.toBe(
      category,
    );

    expect(CategoryRepository.restoreById).toHaveBeenCalledWith(CATEGORY_ID);
    expect(CacheUtils.invalidateCacheByPattern).toHaveBeenCalledWith(
      'category:*',
    );
  });

  it('throws 404 when the category cannot be restored', async () => {
    (CategoryRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      CategoryService.restoreCategory(CATEGORY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Category not found or not deleted',
    });
  });
});
