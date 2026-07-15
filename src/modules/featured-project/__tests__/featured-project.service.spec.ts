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
