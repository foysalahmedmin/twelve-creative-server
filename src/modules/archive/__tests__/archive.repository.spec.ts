jest.mock('../../../builder/app-query-find', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import AppQueryFind from '../../../builder/app-query-find';
import * as ArchiveRepository from '../archive.repository';

const result = {
  data: [],
  meta: { total: 0, page: 1, limit: 10, total_pages: 0 },
};

const queryBuilder = {
  populate: jest.fn(),
  search: jest.fn(),
  filter: jest.fn(),
  sort: jest.fn(),
  paginate: jest.fn(),
  fields: jest.fn(),
  tap: jest.fn(),
  execute: jest.fn(),
};

describe('ArchiveRepository public queries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(queryBuilder).forEach((method) => {
      method.mockReturnValue(queryBuilder);
    });
    queryBuilder.execute.mockResolvedValue(result);
    (AppQueryFind as jest.Mock).mockReturnValue(queryBuilder);
  });

  it('cannot be switched to draft/deleted posts or internal projections', async () => {
    await ArchiveRepository.findPublicPaginated({
      status: 'draft',
      is_deleted: true,
      fields: '+is_deleted,deleted_at',
      or: { status: 'draft' },
      and: { is_deleted: true },
      type: 'video',
      search: 'campaign',
      sort: 'title',
      page: '1',
      limit: '10',
    });

    expect(AppQueryFind).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'active',
        is_deleted: { $ne: true },
        type: 'video',
        search: 'campaign',
        sort: 'title',
        page: '1',
        limit: '10',
      }),
    );
    const publicParams = (AppQueryFind as jest.Mock).mock.calls[0][1];
    expect(publicParams).not.toHaveProperty('fields');
    expect(publicParams).not.toHaveProperty('or');
    expect(publicParams).not.toHaveProperty('and');
    expect(queryBuilder.filter).toHaveBeenCalledWith([
      'type',
      'is_featured',
      'categories',
      'tags',
      'status',
      'is_deleted',
    ]);
    expect(queryBuilder.fields).toHaveBeenCalledWith(
      expect.not.arrayContaining(['is_deleted', 'deleted_at']),
    );
  });

  it('uses public-only populated fields and a deterministic default sort', async () => {
    await expect(ArchiveRepository.findPublicPaginated({})).resolves.toEqual(
      result,
    );

    expect(AppQueryFind).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sort: '-created_at',
        page: '1',
        limit: '100',
      }),
    );
    expect(queryBuilder.populate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'thumbnail',
          select: 'name url mimetype size caption',
        }),
        expect.objectContaining({ path: 'categories', select: 'name icon' }),
        { path: 'user', select: 'name' },
      ]),
    );
    expect(queryBuilder.execute).toHaveBeenCalledTimes(1);
  });
});
