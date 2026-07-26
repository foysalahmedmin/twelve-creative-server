import httpStatus from 'http-status';

jest.mock('../industry.repository');
jest.mock('../../booking/booking.repository');
jest.mock('../../featured-project/featured-project.repository');
jest.mock('../../page-cta/page-cta.repository');
jest.mock('../../showcase-video/showcase-video.repository');
jest.mock('../../testimonial/testimonial.repository');
jest.mock('../../work/work.repository');
jest.mock('../industry.model', () => ({
  Industry: { findOne: jest.fn() },
}));

import * as FeaturedProjectRepository from '../../featured-project/featured-project.repository';
import * as BookingRepository from '../../booking/booking.repository';
import * as PageCtaRepository from '../../page-cta/page-cta.repository';
import * as ShowcaseVideoRepository from '../../showcase-video/showcase-video.repository';
import * as TestimonialRepository from '../../testimonial/testimonial.repository';
import * as WorkRepository from '../../work/work.repository';
import { Industry } from '../industry.model';
import * as IndustryRepository from '../industry.repository';
import * as IndustryService from '../industry.service';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';
const reelThumbnail =
  'https://images.example.com/hospitality-reel-thumbnail.jpg';
const reelVideo = {
  source: 'url' as const,
  value: 'https://videos.example.com/hospitality-reel.mp4',
};

describe('IndustryService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (TestimonialRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (WorkRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (PageCtaRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (BookingRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
  });

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

const industry = {
  _id: INDUSTRY_ID,
  name: 'Hospitality',
  slug: 'hospitality',
  reel_thumbnail: reelThumbnail,
  reel_video: reelVideo,
  order: 0,
  is_active: true,
};

describe('IndustryService complete contract', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (TestimonialRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (WorkRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (PageCtaRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (BookingRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (IndustryRepository.countExistingByIds as jest.Mock).mockResolvedValue(1);
  });

  it('creates an industry after checking slug uniqueness', async () => {
    (Industry.findOne as jest.Mock).mockResolvedValue(null);
    (IndustryRepository.create as jest.Mock).mockResolvedValue(industry);

    await expect(
      IndustryService.createIndustry({
        name: industry.name,
        slug: industry.slug,
        reel_thumbnail: reelThumbnail,
        reel_video: reelVideo,
        is_active: true,
      }),
    ).resolves.toEqual(industry);
    expect(Industry.findOne).toHaveBeenCalledWith({ slug: industry.slug });
    expect(IndustryRepository.create).toHaveBeenCalledWith({
      name: industry.name,
      slug: industry.slug,
      reel_thumbnail: reelThumbnail,
      reel_video: reelVideo,
      is_active: true,
    });
  });

  it('rejects creation when another industry owns the slug', async () => {
    (Industry.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439099' },
    });

    await expect(
      IndustryService.createIndustry({
        name: industry.name,
        slug: industry.slug,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: expect.stringContaining(industry.slug),
    });
    expect(IndustryRepository.create).not.toHaveBeenCalled();
  });

  it('creates without a slug uniqueness query when slug is omitted', async () => {
    (IndustryRepository.create as jest.Mock).mockResolvedValue(industry);

    await IndustryService.createIndustry({ name: industry.name });

    expect(Industry.findOne).not.toHaveBeenCalled();
    expect(IndustryRepository.create).toHaveBeenCalledWith({
      name: industry.name,
    });
  });

  it('returns public industries', async () => {
    (IndustryRepository.findPublic as jest.Mock).mockResolvedValue([industry]);

    await expect(IndustryService.getPublicIndustries()).resolves.toEqual({
      data: [industry],
    });
  });

  it('returns the paginated admin collection', async () => {
    const page = {
      data: [industry],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    };
    (IndustryRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      page,
    );

    await expect(
      IndustryService.getIndustries({ search: 'hospitality' }),
    ).resolves.toEqual(page);
    expect(IndustryRepository.findAdminPaginated).toHaveBeenCalledWith({
      search: 'hospitality',
    });
  });

  it('gets an industry by id', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);

    await expect(IndustryService.getIndustry(INDUSTRY_ID)).resolves.toEqual(
      industry,
    );
  });

  it('throws 404 when getting a missing industry', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      IndustryService.getIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Industry not found',
    });
  });

  it('updates an existing industry without rechecking an unchanged slug', async () => {
    const updated = { ...industry, name: 'Luxury Hospitality' };
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (IndustryRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(
      IndustryService.updateIndustry(INDUSTRY_ID, {
        name: updated.name,
        slug: industry.slug,
      }),
    ).resolves.toEqual(updated);
    expect(Industry.findOne).not.toHaveBeenCalled();
  });

  it('checks uniqueness before changing an industry slug', async () => {
    const nextSlug = 'luxury-hospitality';
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (Industry.findOne as jest.Mock).mockResolvedValue(null);
    (IndustryRepository.updateById as jest.Mock).mockResolvedValue({
      ...industry,
      slug: nextSlug,
    });

    await IndustryService.updateIndustry(INDUSTRY_ID, { slug: nextSlug });

    expect(Industry.findOne).toHaveBeenCalledWith({ slug: nextSlug });
    expect(IndustryRepository.updateById).toHaveBeenCalledWith(INDUSTRY_ID, {
      slug: nextSlug,
    });
  });

  it('forwards reel media updates and supports explicitly clearing them', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (IndustryRepository.updateById as jest.Mock).mockResolvedValue({
      ...industry,
      reel_thumbnail: null,
      reel_video: null,
    });

    await expect(
      IndustryService.updateIndustry(INDUSTRY_ID, {
        reel_thumbnail: null,
        reel_video: null,
      }),
    ).resolves.toMatchObject({
      reel_thumbnail: null,
      reel_video: null,
    });
    expect(IndustryRepository.updateById).toHaveBeenCalledWith(INDUSTRY_ID, {
      reel_thumbnail: null,
      reel_video: null,
    });
  });

  it('does not update a missing industry', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      IndustryService.updateIndustry(INDUSTRY_ID, { name: 'Missing' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(IndustryRepository.updateById).not.toHaveBeenCalled();
  });

  it('reorders industries through the repository', async () => {
    const items = [{ _id: INDUSTRY_ID, order: 2 }];
    (IndustryRepository.updateOrder as jest.Mock).mockResolvedValue(undefined);

    await expect(
      IndustryService.reorderIndustries(items),
    ).resolves.toBeUndefined();
    expect(IndustryRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  it('rejects duplicate or missing Industry reorder records', async () => {
    const duplicateItems = [
      { _id: INDUSTRY_ID, order: 0 },
      { _id: INDUSTRY_ID, order: 1 },
    ];
    await expect(
      IndustryService.reorderIndustries(duplicateItems),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Industry reorder items must be unique',
    });

    (IndustryRepository.countExistingByIds as jest.Mock).mockResolvedValue(0);
    await expect(
      IndustryService.reorderIndustries([{ _id: INDUSTRY_ID, order: 0 }]),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'One or more industries were not found',
    });
    expect(IndustryRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('throws 404 before soft deletion when the industry is missing', async () => {
    (IndustryRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      IndustryService.deleteIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FeaturedProjectRepository.countByIndustry).not.toHaveBeenCalled();
  });

  it('throws 404 before permanent deletion when the industry is missing', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      IndustryService.deleteIndustryPermanent(INDUSTRY_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(IndustryRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('blocks permanent deletion while media references the industry', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      industry,
    );
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(1);

    await expect(
      IndustryService.deleteIndustryPermanent(INDUSTRY_ID),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });
    expect(IndustryRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('allows soft deletion with historical bookings but blocks permanent deletion', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (IndustryRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      industry,
    );
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (BookingRepository.countByIndustry as jest.Mock).mockResolvedValue(1);

    await expect(
      IndustryService.deleteIndustry(INDUSTRY_ID),
    ).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledTimes(1);

    await expect(
      IndustryService.deleteIndustryPermanent(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: expect.stringContaining('1 historical booking(s)'),
    });
    expect(IndustryRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('blocks deletion while testimonials or works reference the industry', async () => {
    const softDelete = jest.fn();
    (IndustryRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (TestimonialRepository.countByIndustry as jest.Mock).mockResolvedValue(2);
    (WorkRepository.countByIndustry as jest.Mock).mockResolvedValue(3);

    await expect(
      IndustryService.deleteIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: expect.stringContaining('2 testimonial(s)'),
    });
    expect(softDelete).not.toHaveBeenCalled();
  });

  it('blocks deletion while a page CTA override references the industry', async () => {
    const softDelete = jest.fn();
    (IndustryRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });
    (FeaturedProjectRepository.countByIndustry as jest.Mock).mockResolvedValue(
      0,
    );
    (ShowcaseVideoRepository.countByIndustry as jest.Mock).mockResolvedValue(0);
    (PageCtaRepository.countByIndustry as jest.Mock).mockResolvedValue(1);

    await expect(
      IndustryService.deleteIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: expect.stringContaining('1 page CTA override(s)'),
    });
    expect(softDelete).not.toHaveBeenCalled();
  });

  it('restores a deleted industry when its slug remains unique', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      industry,
    );
    (Industry.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => INDUSTRY_ID },
    });
    (IndustryRepository.restoreById as jest.Mock).mockResolvedValue(industry);

    await expect(IndustryService.restoreIndustry(INDUSTRY_ID)).resolves.toEqual(
      industry,
    );
    expect(IndustryRepository.restoreById).toHaveBeenCalledWith(INDUSTRY_ID);
  });

  it('rejects restore when the deleted industry cannot be found', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      IndustryService.restoreIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(Industry.findOne).not.toHaveBeenCalled();
  });

  it('rejects restore when another industry now owns the slug', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      industry,
    );
    (Industry.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439099' },
    });

    await expect(
      IndustryService.restoreIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });
    expect(IndustryRepository.restoreById).not.toHaveBeenCalled();
  });

  it('rejects restore when the repository reports a non-deleted record', async () => {
    (IndustryRepository.findByIdWithDeletedLean as jest.Mock).mockResolvedValue(
      industry,
    );
    (Industry.findOne as jest.Mock).mockResolvedValue(null);
    (IndustryRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      IndustryService.restoreIndustry(INDUSTRY_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Industry not found or not deleted',
    });
  });
});
