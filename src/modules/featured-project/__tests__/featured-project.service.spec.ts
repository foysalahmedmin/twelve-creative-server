import httpStatus from 'http-status';

jest.mock('../featured-project.repository');
jest.mock('../../industry/industry.repository');

import * as IndustryRepository from '../../industry/industry.repository';
import * as FeaturedProjectRepository from '../featured-project.repository';
import * as FeaturedProjectService from '../featured-project.service';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';
const PROJECT_ID = '507f1f77bcf86cd799439012';

const industry = {
  _id: INDUSTRY_ID,
  name: 'Hospitality',
  slug: 'hospitality',
  order: 0,
  is_active: false,
};

const project = {
  _id: PROJECT_ID,
  title: 'Hotel film',
  industry,
  aspect: 'reel' as const,
  thumbnail: '/hotel.jpg',
  video: { source: 'url' as const, value: '/hotel.mp4' },
  order: 0,
  is_active: true,
};

describe('FeaturedProjectService', () => {
  it('creates a project for an existing inactive industry and returns it populated', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (FeaturedProjectRepository.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => PROJECT_ID },
    });
    (FeaturedProjectRepository.findByIdLean as jest.Mock).mockResolvedValue(
      project,
    );

    const result = await FeaturedProjectService.createFeaturedProject({
      title: project.title,
      industry: INDUSTRY_ID,
      aspect: project.aspect,
      thumbnail: project.thumbnail,
      video: project.video,
      order: 0,
      is_active: true,
    });

    expect(FeaturedProjectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ industry: INDUSTRY_ID }),
    );
    expect(result.industry).toEqual(industry);
  });

  it('rejects a valid ObjectId that does not resolve to an industry', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      FeaturedProjectService.createFeaturedProject({
        title: project.title,
        industry: INDUSTRY_ID,
        aspect: project.aspect,
        thumbnail: project.thumbnail,
        video: project.video,
        order: 0,
        is_active: true,
      }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('normalizes and forwards the public industry slug', async () => {
    (FeaturedProjectRepository.findPublic as jest.Mock).mockResolvedValue([]);

    await FeaturedProjectService.getPublicFeaturedProjects({
      industry_slug: ' Hospitality ',
    });

    expect(FeaturedProjectRepository.findPublic).toHaveBeenCalledWith(
      'hospitality',
    );
  });

  it('rejects reordering projects from different industries', async () => {
    (
      FeaturedProjectRepository.findReorderRecords as jest.Mock
    ).mockResolvedValue([
      { _id: PROJECT_ID, industry: INDUSTRY_ID },
      {
        _id: '507f1f77bcf86cd799439013',
        industry: '507f1f77bcf86cd799439099',
      },
    ]);

    await expect(
      FeaturedProjectService.reorderFeaturedProjects([
        { _id: PROJECT_ID, order: 0 },
        { _id: '507f1f77bcf86cd799439013', order: 1 },
      ]),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });

    expect(FeaturedProjectRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('uses a with-deleted lookup for permanent deletion', async () => {
    (
      FeaturedProjectRepository.findByIdWithDeletedLean as jest.Mock
    ).mockResolvedValue({ ...project, industry: INDUSTRY_ID });

    await FeaturedProjectService.deleteFeaturedProjectPermanent(PROJECT_ID);

    expect(FeaturedProjectRepository.hardDeleteById).toHaveBeenCalledWith(
      PROJECT_ID,
    );
  });
});

describe('FeaturedProjectService complete contract', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('requires an industry when creating a project', async () => {
    await expect(
      FeaturedProjectService.createFeaturedProject({
        title: project.title,
        aspect: project.aspect,
        thumbnail: project.thumbnail,
        video: project.video,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Industry is required',
    });
    expect(IndustryRepository.findByIdLean).not.toHaveBeenCalled();
    expect(FeaturedProjectRepository.create).not.toHaveBeenCalled();
  });

  it('returns the public collection without a slug filter', async () => {
    (FeaturedProjectRepository.findPublic as jest.Mock).mockResolvedValue([
      project,
    ]);

    await expect(
      FeaturedProjectService.getPublicFeaturedProjects(),
    ).resolves.toEqual({ data: [project] });
    expect(FeaturedProjectRepository.findPublic).toHaveBeenCalledWith(
      undefined,
    );
  });

  it('returns the paginated admin collection', async () => {
    const page = {
      data: [project],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    };
    (
      FeaturedProjectRepository.findAdminPaginated as jest.Mock
    ).mockResolvedValue(page);

    await expect(
      FeaturedProjectService.getFeaturedProjects({
        industry: INDUSTRY_ID,
        page: 1,
      }),
    ).resolves.toEqual(page);
    expect(FeaturedProjectRepository.findAdminPaginated).toHaveBeenCalledWith({
      industry: INDUSTRY_ID,
      page: 1,
    });
  });

  it('gets a project by id', async () => {
    (FeaturedProjectRepository.findByIdLean as jest.Mock).mockResolvedValue(
      project,
    );

    await expect(
      FeaturedProjectService.getFeaturedProject(PROJECT_ID),
    ).resolves.toEqual(project);
  });

  it('throws 404 when getting a missing project', async () => {
    (FeaturedProjectRepository.findByIdLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      FeaturedProjectService.getFeaturedProject(PROJECT_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Featured project not found',
    });
  });

  it('updates an existing project and returns the populated result', async () => {
    const updated = { ...project, title: 'Updated hotel film' };
    (FeaturedProjectRepository.findByIdLean as jest.Mock)
      .mockResolvedValueOnce(project)
      .mockResolvedValueOnce(updated);
    (FeaturedProjectRepository.updateById as jest.Mock).mockResolvedValue(
      updated,
    );

    await expect(
      FeaturedProjectService.updateFeaturedProject(PROJECT_ID, {
        title: updated.title,
      }),
    ).resolves.toEqual(updated);
    expect(FeaturedProjectRepository.updateById).toHaveBeenCalledWith(
      PROJECT_ID,
      { title: updated.title },
    );
    expect(IndustryRepository.findByIdLean).not.toHaveBeenCalled();
  });

  it('validates a changed industry before updating', async () => {
    const nextIndustryId = '507f1f77bcf86cd799439099';
    (FeaturedProjectRepository.findByIdLean as jest.Mock)
      .mockResolvedValueOnce(project)
      .mockResolvedValueOnce({ ...project, industry });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      ...industry,
      _id: nextIndustryId,
    });

    await FeaturedProjectService.updateFeaturedProject(PROJECT_ID, {
      industry: nextIndustryId,
    });

    expect(IndustryRepository.findByIdLean).toHaveBeenCalledWith(
      nextIndustryId,
    );
    expect(FeaturedProjectRepository.updateById).toHaveBeenCalledWith(
      PROJECT_ID,
      { industry: nextIndustryId },
    );
  });

  it('does not update a missing project', async () => {
    (FeaturedProjectRepository.findByIdLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      FeaturedProjectService.updateFeaturedProject(PROJECT_ID, {
        title: 'No-op',
      }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FeaturedProjectRepository.updateById).not.toHaveBeenCalled();
  });

  it('rejects duplicate reorder ids', async () => {
    const items = [
      { _id: PROJECT_ID, order: 0 },
      { _id: PROJECT_ID, order: 1 },
    ];

    await expect(
      FeaturedProjectService.reorderFeaturedProjects(items),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Featured project reorder items must be unique',
    });
    expect(FeaturedProjectRepository.findReorderRecords).not.toHaveBeenCalled();
  });

  it('rejects reorder ids that do not all exist', async () => {
    (
      FeaturedProjectRepository.findReorderRecords as jest.Mock
    ).mockResolvedValue([{ _id: PROJECT_ID, industry: INDUSTRY_ID }]);
    const items = [
      { _id: PROJECT_ID, order: 0 },
      { _id: '507f1f77bcf86cd799439013', order: 1 },
    ];

    await expect(
      FeaturedProjectService.reorderFeaturedProjects(items),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FeaturedProjectRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('reorders projects scoped to their shared industry', async () => {
    const secondId = '507f1f77bcf86cd799439013';
    const items = [
      { _id: PROJECT_ID, order: 1 },
      { _id: secondId, order: 0 },
    ];
    (
      FeaturedProjectRepository.findReorderRecords as jest.Mock
    ).mockResolvedValue([
      { _id: PROJECT_ID, industry: INDUSTRY_ID },
      { _id: secondId, industry: INDUSTRY_ID },
    ]);

    await expect(
      FeaturedProjectService.reorderFeaturedProjects(items),
    ).resolves.toBeUndefined();
    expect(FeaturedProjectRepository.updateOrder).toHaveBeenCalledWith(
      items,
      INDUSTRY_ID,
    );
  });

  it('soft-deletes an existing project', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (FeaturedProjectRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await expect(
      FeaturedProjectService.deleteFeaturedProject(PROJECT_ID),
    ).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft-delete a missing project', async () => {
    (FeaturedProjectRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      FeaturedProjectService.deleteFeaturedProject(PROJECT_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('does not permanently delete a missing project', async () => {
    (
      FeaturedProjectRepository.findByIdWithDeletedLean as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      FeaturedProjectService.deleteFeaturedProjectPermanent(PROJECT_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FeaturedProjectRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('restores a deleted project after validating its industry', async () => {
    (
      FeaturedProjectRepository.findByIdWithDeletedLean as jest.Mock
    ).mockResolvedValue({ ...project, industry: INDUSTRY_ID });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (FeaturedProjectRepository.restoreById as jest.Mock).mockResolvedValue(
      project,
    );
    (FeaturedProjectRepository.findByIdLean as jest.Mock).mockResolvedValue(
      project,
    );

    await expect(
      FeaturedProjectService.restoreFeaturedProject(PROJECT_ID),
    ).resolves.toEqual(project);
    expect(FeaturedProjectRepository.restoreById).toHaveBeenCalledWith(
      PROJECT_ID,
    );
  });

  it('rejects restore when the project does not exist with deleted records', async () => {
    (
      FeaturedProjectRepository.findByIdWithDeletedLean as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      FeaturedProjectService.restoreFeaturedProject(PROJECT_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(IndustryRepository.findByIdLean).not.toHaveBeenCalled();
  });

  it('rejects restore when the repository cannot restore the record', async () => {
    (
      FeaturedProjectRepository.findByIdWithDeletedLean as jest.Mock
    ).mockResolvedValue({ ...project, industry: INDUSTRY_ID });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (FeaturedProjectRepository.restoreById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      FeaturedProjectService.restoreFeaturedProject(PROJECT_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Featured project not found or not deleted',
    });
  });
});
