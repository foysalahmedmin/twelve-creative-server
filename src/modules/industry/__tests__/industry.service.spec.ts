import httpStatus from 'http-status';

jest.mock('../industry.repository');
jest.mock('../../featured-project/featured-project.repository');
jest.mock('../../showcase-video/showcase-video.repository');
jest.mock('../industry.model', () => ({
  Industry: { findOne: jest.fn() },
}));

import * as FeaturedProjectRepository from '../../featured-project/featured-project.repository';
import * as ShowcaseVideoRepository from '../../showcase-video/showcase-video.repository';
import * as IndustryRepository from '../industry.repository';
import * as IndustryService from '../industry.service';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';

describe('IndustryService', () => {
  it('returns compact options from the repository', async () => {
    const options = [
      {
        _id: INDUSTRY_ID,
        name: 'Hospitality',
        slug: 'hospitality',
        order: 0,
        is_active: true,
      },
    ];
    (IndustryRepository.findOptions as jest.Mock).mockResolvedValue(options);

    await expect(IndustryService.getIndustryOptions()).resolves.toEqual(
      options,
    );
  });

  it('blocks soft deletion when either related collection has references', async () => {
    const softDelete = jest.fn();
    (IndustryRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      2,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(1);

    await expect(
      IndustryService.deleteIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: expect.stringContaining('2 featured project(s)'),
    });

    expect(softDelete).not.toHaveBeenCalled();
  });

  it('allows deletion when no featured project or showcase video references it', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (IndustryRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(0);

    await IndustryService.deleteIndustry(INDUSTRY_ID);

    expect(softDelete).toHaveBeenCalledTimes(1);
  });

  it('uses a with-deleted lookup before permanent deletion', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      {
        _id: INDUSTRY_ID,
      },
    );
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(0);

    await IndustryService.deleteIndustryPermanent(INDUSTRY_ID);

    expect(IndustryRepository.hardDeleteById).toHaveBeenCalledWith(INDUSTRY_ID);
  });
});
