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

describe('ShowcaseVideoService complete contract', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('requires an industry when creating a showcase video', async () => {
    await expect(
      ShowcaseVideoService.createShowcaseVideo({
        video: video.video,
        thumbnail: video.thumbnail,
        alt: video.alt,
        aspect: video.aspect,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Industry is required',
    });
    expect(ShowcaseVideoRepository.create).not.toHaveBeenCalled();
  });

  it('rejects creation when the industry does not exist', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.createShowcaseVideo({
        industry: INDUSTRY_ID,
        video: video.video,
        thumbnail: video.thumbnail,
        alt: video.alt,
        aspect: video.aspect,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Industry not found',
    });
  });

  it('allows a YouTube video without a thumbnail', async () => {
    const youtubeVideo = {
      ...video,
      video: { source: 'youtube' as const, value: 'youtube-id' },
      thumbnail: undefined,
    };
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (ShowcaseVideoRepository.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => VIDEO_ID },
    });
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(
      youtubeVideo,
    );

    await expect(
      ShowcaseVideoService.createShowcaseVideo({
        industry: INDUSTRY_ID,
        video: youtubeVideo.video,
        alt: youtubeVideo.alt,
        aspect: youtubeVideo.aspect,
      }),
    ).resolves.toEqual(youtubeVideo);
  });

  it('returns the public collection without filters', async () => {
    (ShowcaseVideoRepository.findPublic as jest.Mock).mockResolvedValue([
      video,
    ]);

    await expect(
      ShowcaseVideoService.getPublicShowcaseVideos(),
    ).resolves.toEqual({ data: [video] });
    expect(ShowcaseVideoRepository.findPublic).toHaveBeenCalledWith({
      aspect: undefined,
      industry_slug: undefined,
    });
  });

  it('returns the paginated admin collection', async () => {
    const page = {
      data: [video],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    };
    (ShowcaseVideoRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      page,
    );

    await expect(
      ShowcaseVideoService.getShowcaseVideos({ aspect: 'reel' }),
    ).resolves.toEqual(page);
    expect(ShowcaseVideoRepository.findAdminPaginated).toHaveBeenCalledWith({
      aspect: 'reel',
    });
  });

  it('gets a showcase video by id', async () => {
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(
      video,
    );

    await expect(
      ShowcaseVideoService.getShowcaseVideo(VIDEO_ID),
    ).resolves.toEqual(video);
  });

  it('throws 404 when getting a missing showcase video', async () => {
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.getShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Showcase video not found',
    });
  });

  it('updates an existing video and returns its populated form', async () => {
    const updated = { ...video, alt: 'Updated showcase' };
    (ShowcaseVideoRepository.findByIdLean as jest.Mock)
      .mockResolvedValueOnce(video)
      .mockResolvedValueOnce(updated);
    (ShowcaseVideoRepository.updateById as jest.Mock).mockResolvedValue(
      updated,
    );

    await expect(
      ShowcaseVideoService.updateShowcaseVideo(VIDEO_ID, {
        alt: updated.alt,
      }),
    ).resolves.toEqual(updated);
    expect(ShowcaseVideoRepository.updateById).toHaveBeenCalledWith(VIDEO_ID, {
      alt: updated.alt,
    });
  });

  it('validates a changed industry before updating', async () => {
    const nextIndustryId = '507f1f77bcf86cd799439099';
    (ShowcaseVideoRepository.findByIdLean as jest.Mock)
      .mockResolvedValueOnce(video)
      .mockResolvedValueOnce(video);
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      ...industry,
      _id: nextIndustryId,
    });

    await ShowcaseVideoService.updateShowcaseVideo(VIDEO_ID, {
      industry: nextIndustryId,
    });

    expect(IndustryRepository.findByIdLean).toHaveBeenCalledWith(
      nextIndustryId,
    );
    expect(ShowcaseVideoRepository.updateById).toHaveBeenCalledWith(VIDEO_ID, {
      industry: nextIndustryId,
    });
  });

  it('does not update a missing showcase video', async () => {
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.updateShowcaseVideo(VIDEO_ID, { alt: 'Missing' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(ShowcaseVideoRepository.updateById).not.toHaveBeenCalled();
  });

  it('rejects an update that makes a direct video unrenderable', async () => {
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(
      video,
    );

    await expect(
      ShowcaseVideoService.updateShowcaseVideo(VIDEO_ID, {
        thumbnail: '   ',
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Thumbnail is required for URL and uploaded showcase videos',
    });
    expect(ShowcaseVideoRepository.updateById).not.toHaveBeenCalled();
  });

  it('rejects duplicate reorder ids', async () => {
    const items = [
      { _id: VIDEO_ID, order: 0 },
      { _id: VIDEO_ID, order: 1 },
    ];

    await expect(
      ShowcaseVideoService.reorderShowcaseVideos(items),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Showcase video reorder items must be unique',
    });
    expect(ShowcaseVideoRepository.findReorderRecords).not.toHaveBeenCalled();
  });

  it('rejects reorder ids that do not all exist', async () => {
    (ShowcaseVideoRepository.findReorderRecords as jest.Mock).mockResolvedValue(
      [{ _id: VIDEO_ID, industry: INDUSTRY_ID, aspect: 'reel' }],
    );
    const items = [
      { _id: VIDEO_ID, order: 0 },
      { _id: '507f1f77bcf86cd799439013', order: 1 },
    ];

    await expect(
      ShowcaseVideoService.reorderShowcaseVideos(items),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(ShowcaseVideoRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('reorders videos scoped to one industry and aspect', async () => {
    const secondId = '507f1f77bcf86cd799439013';
    const items = [
      { _id: VIDEO_ID, order: 1 },
      { _id: secondId, order: 0 },
    ];
    (ShowcaseVideoRepository.findReorderRecords as jest.Mock).mockResolvedValue(
      [
        { _id: VIDEO_ID, industry: INDUSTRY_ID, aspect: 'reel' },
        { _id: secondId, industry: INDUSTRY_ID, aspect: 'reel' },
      ],
    );

    await expect(
      ShowcaseVideoService.reorderShowcaseVideos(items),
    ).resolves.toBeUndefined();
    expect(ShowcaseVideoRepository.updateOrder).toHaveBeenCalledWith(
      items,
      INDUSTRY_ID,
      'reel',
    );
  });

  it('soft-deletes an existing showcase video', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (ShowcaseVideoRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await expect(
      ShowcaseVideoService.deleteShowcaseVideo(VIDEO_ID),
    ).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft-delete a missing showcase video', async () => {
    (ShowcaseVideoRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.deleteShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('permanently deletes an existing showcase video', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue({ ...video, industry: INDUSTRY_ID });

    await expect(
      ShowcaseVideoService.deleteShowcaseVideoPermanent(VIDEO_ID),
    ).resolves.toBeUndefined();
    expect(ShowcaseVideoRepository.hardDeleteById).toHaveBeenCalledWith(
      VIDEO_ID,
    );
  });

  it('does not permanently delete a missing showcase video', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.deleteShowcaseVideoPermanent(VIDEO_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(ShowcaseVideoRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('restores a valid deleted showcase video', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue({
      ...video,
      industry: INDUSTRY_ID,
    });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (ShowcaseVideoRepository.restoreById as jest.Mock).mockResolvedValue(video);
    (ShowcaseVideoRepository.findByIdLean as jest.Mock).mockResolvedValue(
      video,
    );

    await expect(
      ShowcaseVideoService.restoreShowcaseVideo(VIDEO_ID),
    ).resolves.toEqual(video);
    expect(ShowcaseVideoRepository.restoreById).toHaveBeenCalledWith(VIDEO_ID);
  });

  it('rejects restore when the deleted video cannot be found', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.restoreShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('rejects restore when the deleted video is not renderable', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue({
      ...video,
      industry: INDUSTRY_ID,
      thumbnail: undefined,
    });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);

    await expect(
      ShowcaseVideoService.restoreShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({ status: httpStatus.BAD_REQUEST });
    expect(ShowcaseVideoRepository.restoreById).not.toHaveBeenCalled();
  });

  it('rejects restore when the repository reports a non-deleted record', async () => {
    (
      ShowcaseVideoRepository.findByIdWithDeleted as jest.Mock
    ).mockResolvedValue({
      ...video,
      industry: INDUSTRY_ID,
    });
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (ShowcaseVideoRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      ShowcaseVideoService.restoreShowcaseVideo(VIDEO_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Showcase video not found or not deleted',
    });
  });
});
