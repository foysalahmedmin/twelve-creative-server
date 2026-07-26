import httpStatus from 'http-status';

jest.mock('../testimonial.repository');
jest.mock('../../industry/industry.repository');

import * as IndustryRepository from '../../industry/industry.repository';
import * as TestimonialRepository from '../testimonial.repository';
import * as TestimonialService from '../testimonial.service';
import { TTestimonial } from '../testimonial.type';

const TESTIMONIAL_ID = '507f1f77bcf86cd799439031';
const INDUSTRY_ID = '507f1f77bcf86cd799439032';
const industry = {
  _id: INDUSTRY_ID,
  name: 'Hospitality',
  slug: 'hospitality',
  order: 0,
  is_active: true,
};

const testimonial: TTestimonial = {
  _id: TESTIMONIAL_ID,
  industry: INDUSTRY_ID,
  name: 'Jordan Lee',
  designation: 'Founder, Meridian',
  image: '/testimonials/jordan.jpg',
  category: 'message',
  message: 'Twelve Creative transformed how our brand shows up everywhere.',
  order: 1,
  is_active: true,
};

const paginated = {
  data: [testimonial],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('TestimonialService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (TestimonialRepository.countExistingByIds as jest.Mock).mockResolvedValue(
      1,
    );
  });

  it('creates a testimonial', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(industry);
    (TestimonialRepository.create as jest.Mock).mockResolvedValue(testimonial);
    (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue({
      ...testimonial,
      industry,
    });

    await expect(
      TestimonialService.createTestimonial(testimonial),
    ).resolves.toEqual({ ...testimonial, industry });
    expect(TestimonialRepository.create).toHaveBeenCalledWith(testimonial);
  });

  it('rejects creation when the Industry does not exist', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      TestimonialService.createTestimonial(testimonial),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Industry not found',
    });
    expect(TestimonialRepository.create).not.toHaveBeenCalled();
  });

  it('returns public testimonials', async () => {
    (TestimonialRepository.findPublic as jest.Mock).mockResolvedValue([
      testimonial,
    ]);

    await expect(
      TestimonialService.getPublicTestimonials({
        industry_slug: ' Hospitality ',
      }),
    ).resolves.toEqual({ data: [testimonial] });
    expect(TestimonialRepository.findPublic).toHaveBeenCalledWith(
      'hospitality',
    );
  });

  it('returns the paginated admin testimonial list', async () => {
    const query = { filter: 'active', search: 'Jordan' };
    (TestimonialRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      paginated,
    );

    await expect(TestimonialService.getTestimonials(query)).resolves.toEqual(
      paginated,
    );
    expect(TestimonialRepository.findAdminPaginated).toHaveBeenCalledWith(
      query,
    );
  });

  describe('getTestimonial', () => {
    it('returns one testimonial', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue(
        testimonial,
      );

      await expect(
        TestimonialService.getTestimonial(TESTIMONIAL_ID),
      ).resolves.toEqual(testimonial);
    });

    it('throws 404 when the testimonial does not exist', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        TestimonialService.getTestimonial(TESTIMONIAL_ID),
      ).rejects.toMatchObject({
        status: httpStatus.NOT_FOUND,
        message: 'Testimonial not found',
      });
    });
  });

  describe('updateTestimonial', () => {
    it('updates an existing testimonial', async () => {
      const payload = { designation: 'CEO, Meridian' };
      const updated = { ...testimonial, ...payload };
      (TestimonialRepository.findByIdLean as jest.Mock)
        .mockResolvedValueOnce(testimonial)
        .mockResolvedValueOnce(updated);
      (TestimonialRepository.updateById as jest.Mock).mockResolvedValue(
        updated,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, payload),
      ).resolves.toEqual(updated);
      expect(TestimonialRepository.updateById).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
        payload,
        ['video_message', 'thumbnail'],
      );
    });

    it('validates the merged text state and rejects a blank message', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValueOnce(
        testimonial,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, {
          message: '   ',
        }),
      ).rejects.toMatchObject({
        status: httpStatus.BAD_REQUEST,
        message: expect.stringContaining('Message text is required'),
      });
      expect(TestimonialRepository.updateById).not.toHaveBeenCalled();
    });

    it('rejects switching to a video category without a merged video', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValueOnce(
        testimonial,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, {
          category: 'video_message',
        }),
      ).rejects.toMatchObject({
        status: httpStatus.BAD_REQUEST,
        message: 'Video is required for a video testimonial',
      });
      expect(TestimonialRepository.updateById).not.toHaveBeenCalled();
    });

    it('requires a thumbnail when switching to a direct or uploaded video', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValueOnce(
        testimonial,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, {
          category: 'video_message',
          video_message: {
            source: 'upload',
            value: '/uploads/testimonials/jordan.mp4',
          },
        }),
      ).rejects.toMatchObject({
        status: httpStatus.BAD_REQUEST,
        message:
          'Thumbnail is required for URL and uploaded video testimonials',
      });
      expect(TestimonialRepository.updateById).not.toHaveBeenCalled();
    });

    it('switches to YouTube video and explicitly clears stale message text', async () => {
      const payload: Partial<TTestimonial> = {
        category: 'video_message',
        video_message: {
          source: 'youtube',
          value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      };
      const updated = { ...testimonial, ...payload, message: undefined };
      (TestimonialRepository.findByIdLean as jest.Mock)
        .mockResolvedValueOnce(testimonial)
        .mockResolvedValueOnce(updated);
      (TestimonialRepository.updateById as jest.Mock).mockResolvedValue(
        updated,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, payload),
      ).resolves.toEqual(updated);
      expect(TestimonialRepository.updateById).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
        payload,
        ['message'],
      );
    });

    it('switches to text and explicitly clears stale video fields', async () => {
      const videoTestimonial: TTestimonial = {
        ...testimonial,
        category: 'video_message',
        message: undefined,
        video_message: {
          source: 'upload',
          value: '/uploads/testimonials/jordan.mp4',
        },
        thumbnail: '/uploads/testimonials/jordan-poster.jpg',
      };
      const payload: Partial<TTestimonial> = {
        category: 'message',
        message: 'The team gave us a reliable creative operating system.',
      };
      const updated = { ...videoTestimonial, ...payload };
      (TestimonialRepository.findByIdLean as jest.Mock)
        .mockResolvedValueOnce(videoTestimonial)
        .mockResolvedValueOnce(updated);
      (TestimonialRepository.updateById as jest.Mock).mockResolvedValue(
        updated,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, payload),
      ).resolves.toEqual(updated);
      expect(TestimonialRepository.updateById).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
        payload,
        ['video_message', 'thumbnail'],
      );
    });

    it('throws 404 before updating a missing testimonial', async () => {
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, {
          designation: 'Missing',
        }),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(TestimonialRepository.updateById).not.toHaveBeenCalled();
    });
  });

  it('forwards testimonial reorder items', async () => {
    const items = [{ _id: TESTIMONIAL_ID, order: 4 }];
    (TestimonialRepository.updateOrder as jest.Mock).mockResolvedValue(
      undefined,
    );

    await TestimonialService.reorderTestimonials(items);

    expect(TestimonialRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  it('rejects duplicate or missing testimonial reorder records', async () => {
    const duplicateItems = [
      { _id: TESTIMONIAL_ID, order: 0 },
      { _id: TESTIMONIAL_ID, order: 1 },
    ];
    await expect(
      TestimonialService.reorderTestimonials(duplicateItems),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Testimonial reorder items must be unique',
    });

    (TestimonialRepository.countExistingByIds as jest.Mock).mockResolvedValue(
      0,
    );
    await expect(
      TestimonialService.reorderTestimonials([
        { _id: TESTIMONIAL_ID, order: 0 },
      ]),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'One or more testimonials were not found',
    });
    expect(TestimonialRepository.updateOrder).not.toHaveBeenCalled();
  });

  describe('deleteTestimonial', () => {
    it('soft deletes an existing testimonial', async () => {
      const softDelete = jest.fn().mockResolvedValue(undefined);
      (TestimonialRepository.findById as jest.Mock).mockResolvedValue({
        softDelete,
      });

      await TestimonialService.deleteTestimonial(TESTIMONIAL_ID);

      expect(softDelete).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when soft deleting a missing testimonial', async () => {
      (TestimonialRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        TestimonialService.deleteTestimonial(TESTIMONIAL_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    });
  });

  describe('deleteTestimonialPermanent', () => {
    it('uses the with-deleted lookup and hard deletes the testimonial', async () => {
      (
        TestimonialRepository.findByIdWithDeleted as jest.Mock
      ).mockResolvedValue(testimonial);

      await TestimonialService.deleteTestimonialPermanent(TESTIMONIAL_ID);

      expect(TestimonialRepository.findByIdWithDeleted).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
      );
      expect(TestimonialRepository.hardDeleteById).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
      );
    });

    it('throws 404 when permanently deleting a missing testimonial', async () => {
      (
        TestimonialRepository.findByIdWithDeleted as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        TestimonialService.deleteTestimonialPermanent(TESTIMONIAL_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(TestimonialRepository.hardDeleteById).not.toHaveBeenCalled();
    });
  });

  describe('restoreTestimonial', () => {
    it('restores a deleted testimonial', async () => {
      (
        TestimonialRepository.findByIdWithDeleted as jest.Mock
      ).mockResolvedValue(testimonial);
      (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(
        industry,
      );
      (TestimonialRepository.restoreById as jest.Mock).mockResolvedValue(
        testimonial,
      );
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue(
        testimonial,
      );

      await expect(
        TestimonialService.restoreTestimonial(TESTIMONIAL_ID),
      ).resolves.toEqual(testimonial);
    });

    it('throws 404 when the testimonial is not deleted or does not exist', async () => {
      (
        TestimonialRepository.findByIdWithDeleted as jest.Mock
      ).mockResolvedValue(testimonial);
      (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(
        industry,
      );
      (TestimonialRepository.restoreById as jest.Mock).mockResolvedValue(null);

      await expect(
        TestimonialService.restoreTestimonial(TESTIMONIAL_ID),
      ).rejects.toMatchObject({
        status: httpStatus.NOT_FOUND,
        message: 'Testimonial not found or not deleted',
      });
    });

    it('does not restore a legacy testimonial with invalid renderable media', async () => {
      (
        TestimonialRepository.findByIdWithDeleted as jest.Mock
      ).mockResolvedValue({
        ...testimonial,
        category: 'video_message',
        message: undefined,
        video_message: {
          source: 'upload',
          value: '/private/testimonial.mp4',
        },
        thumbnail: '/uploads/testimonial.jpg',
      });
      (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(
        industry,
      );

      await expect(
        TestimonialService.restoreTestimonial(TESTIMONIAL_ID),
      ).rejects.toMatchObject({
        status: httpStatus.BAD_REQUEST,
        message: 'A safe video is required for a video testimonial',
      });
      expect(TestimonialRepository.restoreById).not.toHaveBeenCalled();
    });
  });
});
