jest.mock('../../../builder/app-query-find', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import AppQueryFind from '../../../builder/app-query-find';
import * as CategoryRepository from '../category.repository';

const result = {
  data: [],
  meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
};

const queryBuilder = {
  search: jest.fn(),
  filter: jest.fn(),
  sort: jest.fn(),
  paginate: jest.fn(),
  fields: jest.fn(),
  tap: jest.fn(),
  execute: jest.fn(),
};

describe('CategoryRepository public queries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(queryBuilder).forEach((method) => {
      method.mockReturnValue(queryBuilder);
    });
    queryBuilder.execute.mockResolvedValue(result);
    (AppQueryFind as jest.Mock).mockReturnValue(queryBuilder);
  });

  it('always enforces active/non-deleted records and a public projection', async () => {
    await CategoryRepository.findPublicPaginated({
      status: 'inactive',
      is_deleted: true,
      fields: '+is_deleted,deleted_at',
      or: { status: 'inactive' },
      is_featured: true,
    });

    expect(AppQueryFind).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'active',
        is_deleted: { $ne: true },
        is_featured: true,
        sort: 'sequence',
        page: '1',
        limit: '100',
      }),
    );
    const publicParams = (AppQueryFind as jest.Mock).mock.calls[0][1];
    expect(publicParams).not.toHaveProperty('fields');
    expect(publicParams).not.toHaveProperty('or');
    expect(queryBuilder.filter).toHaveBeenCalledWith([
      'status',
      'is_deleted',
      'is_featured',
      'layout',
      'tags',
    ]);
    expect(queryBuilder.sort).toHaveBeenCalledWith([
      'sequence',
      'name',
      'is_featured',
    ]);
    expect(queryBuilder.fields).toHaveBeenCalledWith([
      '_id',
      'icon',
      'name',
      'description',
      'sequence',
      'status',
      'tags',
      'layout',
      'is_featured',
    ]);
  });
});
