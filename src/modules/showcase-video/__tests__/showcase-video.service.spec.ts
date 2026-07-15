import httpStatus from 'http-status';

jest.mock('../showcase-video.repository');
jest.mock('../../industry/industry.repository');

import * as IndustryRepository from '../../industry/industry.repository';
import * as ShowcaseVideoRepository from '../showcase-video.repository';
import * as ShowcaseVideoService from '../showcase-video.service';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';
const VIDEO_ID = '507f1f77bcf86cd799439012';

const industry = {
  _id: INDUSTRY_ID,
  name: 'Hospitality',
  slug: 'hospitality',
  order: 0,
  is_active: true,
};

const video = {
  _id: VIDEO_ID,
  industry,
  video: { source: 'url' as const, value: '/showcase.mp4' },
  thumbnail: '/showcase.jpg',
  alt: 'Hospitality showcase',
  aspect: 'reel' as const,
  order: 0,
  is_active: true,
};

describe('ShowcaseVideoService', () => {
  it('requires an existing industry and returns a populated create response', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (ShowcaseVideoRepository.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => VIDEO_ID },
    });
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(
      video,
    );

    const result = await ShowcaseVideoService.createShowcaseVideo({
      industry: INDUSTRY_ID,
      video: video.video,
      thumbnail: video.thumbnail,
      alt: video.alt,
      aspect: video.aspect,
      order: 0,
      is_active: true,
    });

    expect(ShowcaseVideoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ industry: INDUSTRY_ID }),
    );
    expect(result.industry.slug).toBe('hospitality');
  });

  it('requires a thumbnail for a direct URL or uploaded video', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);

    await expect(
      ShowcaseVideoService.createShowcaseVideo({
        industry: INDUSTRY_ID,
        video: { source: 'url', value: '/showcase.mp4' },
        alt: 'Missing poster',
        aspect: 'reel',
        order: 0,
        is_active: true,
      }),
    ).rejects.toMatchObject({ status: httpStatus.BAD_REQUEST });

    expect(ShowcaseVideoRepository.create).not.toHaveBeenCalled();
  });

  it('forwards both public filters after normalizing the industry slug', async () => {
    (ShowcaseVideoRepository.findPublic as jest.Mock).mockResolvedValue([]);

    await ShowcaseVideoService.getPublicShowcaseVideos({
      aspect: 'landscape',
      industry_slug: ' Hospitality ',
    });

    expect(ShowcaseVideoRepository.findPublic).toHaveBeenCalledWith({
      aspect: 'landscape',
      industry_slug: 'hospitality',
    });
  });

  it('rejects reorder records with different aspect groups', async () => {
    (ShowcaseVideoRepository.findReorderRecords as jest.Mock).mockResolvedValue(
      [
        { _id: VIDEO_ID, industry: INDUSTRY_ID, aspect: 'reel' },
        {
          _id: '507f1f77bcf86cd799439013',
          industry: INDUSTRY_ID,
          aspect: 'landscape',
        },
      ],
    );

    await expect(
      ShowcaseVideoService.reorderShowcaseVideos([
        { _id: VIDEO_ID, order: 0 },
        { _id: '507f1f77bcf86cd799439013', order: 1 },
      ]),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });

    expect(ShowcaseVideoRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('validates the parent industry before restoring a deleted video', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue({ ...video, industry: INDUSTRY_ID });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.restoreShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(ShowcaseVideoRepository.restoreById).not.toHaveBeenCalled();
  });
});
