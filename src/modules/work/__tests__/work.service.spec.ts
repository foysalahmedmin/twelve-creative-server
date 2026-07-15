import httpStatus from 'http-status';

jest.mock('../work.repository');
jest.mock('../work.model', () => ({
  Work: { findOne: jest.fn() },
}));

import { Work } from '../work.model';
import * as WorkRepository from '../work.repository';
import * as WorkService from '../work.service';

const WORK_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';
const work = {
  _id: WORK_ID,
  slug: 'hospitality-growth',
  type: 'Brand Transformation',
  title: 'Hospitality growth system',
  description: 'A complete hospitality case study.',
  image: '/hospitality.jpg',
  image_alt: 'Hospitality project',
  metrics: [],
  tag_slugs: ['hospitality'],
  order: 0,
  is_published: true,
};
const page = {
  data: [work],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('WorkService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a work when its slug is available', async () => {
    (Work.findOne as jest.Mock).mockResolvedValue(null);
    (WorkRepository.create as jest.Mock).mockResolvedValue(work);

    await expect(WorkService.createWork(work)).resolves.toBe(work);

    expect(Work.findOne).toHaveBeenCalledWith({ slug: work.slug });
    expect(WorkRepository.create).toHaveBeenCalledWith(work);
  });

  it('creates a work without querying slug uniqueness when no slug is provided', async () => {
    const draft = { title: 'Draft work' };
    (WorkRepository.create as jest.Mock).mockResolvedValue(draft);

    await expect(WorkService.createWork(draft)).resolves.toBe(draft);

    expect(Work.findOne).not.toHaveBeenCalled();
  });

  it('throws 409 when creating a work with an existing slug', async () => {
    (Work.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => OTHER_ID },
    });

    await expect(WorkService.createWork(work)).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: `A work with slug "${work.slug}" already exists`,
    });

    expect(WorkRepository.create).not.toHaveBeenCalled();
  });

  it('returns the public work list', async () => {
    (WorkRepository.findPublicList as jest.Mock).mockResolvedValue([work]);

    await expect(WorkService.getPublicWorks()).resolves.toEqual({
      data: [work],
    });
  });

  it('returns a published work by slug', async () => {
    (WorkRepository.findBySlugLean as jest.Mock).mockResolvedValue(work);

    await expect(WorkService.getPublicWorkBySlug(work.slug)).resolves.toBe(
      work,
    );

    expect(WorkRepository.findBySlugLean).toHaveBeenCalledWith(work.slug);
  });

  it('throws 404 when no published work matches the slug', async () => {
    (WorkRepository.findBySlugLean as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkService.getPublicWorkBySlug('missing-work'),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Work not found',
    });
  });

  it('returns the paginated admin work list', async () => {
    const query = { page: 2, filter: 'draft' };
    (WorkRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(WorkService.getWorks(query)).resolves.toEqual(page);

    expect(WorkRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns a work by id', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(work);

    await expect(WorkService.getWork(WORK_ID)).resolves.toBe(work);
  });

  it('throws 404 when a work id is not found', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(WorkService.getWork(WORK_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Work not found',
    });
  });

  it('updates a work after checking a changed slug', async () => {
    const payload = {
      slug: 'updated-hospitality-growth',
      title: 'Updated title',
    };
    const updated = { ...work, ...payload };
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(work);
    (Work.findOne as jest.Mock).mockResolvedValue(null);
    (WorkRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(WorkService.updateWork(WORK_ID, payload)).resolves.toEqual(
      updated,
    );

    expect(Work.findOne).toHaveBeenCalledWith({ slug: payload.slug });
    expect(WorkRepository.updateById).toHaveBeenCalledWith(WORK_ID, payload);
  });

  it('does not run a uniqueness query when the slug is unchanged', async () => {
    const payload = { slug: work.slug, title: 'Updated title' };
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(work);
    (WorkRepository.updateById as jest.Mock).mockResolvedValue({
      ...work,
      ...payload,
    });

    await WorkService.updateWork(WORK_ID, payload);

    expect(Work.findOne).not.toHaveBeenCalled();
  });

  it('rejects an update when the work does not exist', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkService.updateWork(WORK_ID, { title: 'Updated title' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(WorkRepository.updateById).not.toHaveBeenCalled();
  });

  it('throws 409 when an updated slug belongs to another work', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(work);
    (Work.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => OTHER_ID },
    });

    await expect(
      WorkService.updateWork(WORK_ID, { slug: 'existing-slug' }),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });

    expect(WorkRepository.updateById).not.toHaveBeenCalled();
  });

  it('reorders works through the repository', async () => {
    const items = [
      { _id: WORK_ID, order: 1 },
      { _id: OTHER_ID, order: 0 },
    ];
    (WorkRepository.updateOrder as jest.Mock).mockResolvedValue(undefined);

    await WorkService.reorderWorks(items);

    expect(WorkRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  it('propagates repository failures while reordering works', async () => {
    const error = new Error('Bulk update failed');
    (WorkRepository.updateOrder as jest.Mock).mockRejectedValue(error);

    await expect(
      WorkService.reorderWorks([{ _id: WORK_ID, order: 0 }]),
    ).rejects.toBe(error);
  });

  it('soft deletes an existing work', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (WorkRepository.findById as jest.Mock).mockResolvedValue({
      ...work,
      softDelete,
    });

    await WorkService.deleteWork(WORK_ID);

    expect(softDelete).toHaveBeenCalledTimes(1);
  });

  it('rejects a soft delete when the work does not exist', async () => {
    (WorkRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(WorkService.deleteWork(WORK_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('permanently deletes an existing work', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(work);

    await WorkService.deleteWorkPermanent(WORK_ID);

    expect(WorkRepository.hardDeleteById).toHaveBeenCalledWith(WORK_ID);
  });

  it('rejects permanent deletion when the work does not exist', async () => {
    (WorkRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkService.deleteWorkPermanent(WORK_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(WorkRepository.hardDeleteById).not.toHaveBeenCalled();
  });
});
