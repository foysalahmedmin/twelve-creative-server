import httpStatus from 'http-status';

jest.mock('../testimonial.repository');

import * as TestimonialRepository from '../testimonial.repository';
import * as TestimonialService from '../testimonial.service';
import { TTestimonial } from '../testimonial.type';

const TESTIMONIAL_ID = '507f1f77bcf86cd799439031';

const testimonial: TTestimonial = {
  _id: TESTIMONIAL_ID,
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
  });

  it('creates a testimonial', async () => {
    (TestimonialRepository.create as jest.Mock).mockResolvedValue(testimonial);

    await expect(
      TestimonialService.createTestimonial(testimonial),
    ).resolves.toEqual(testimonial);
    expect(TestimonialRepository.create).toHaveBeenCalledWith(testimonial);
  });

  it('returns public testimonials', async () => {
    (TestimonialRepository.findPublic as jest.Mock).mockResolvedValue([
      testimonial,
    ]);

    await expect(TestimonialService.getPublicTestimonials()).resolves.toEqual({
      data: [testimonial],
    });
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
      (TestimonialRepository.findByIdLean as jest.Mock).mockResolvedValue(
        testimonial,
      );
      (TestimonialRepository.updateById as jest.Mock).mockResolvedValue(
        updated,
      );

      await expect(
        TestimonialService.updateTestimonial(TESTIMONIAL_ID, payload),
      ).resolves.toEqual(updated);
      expect(TestimonialRepository.updateById).toHaveBeenCalledWith(
        TESTIMONIAL_ID,
        payload,
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
      (TestimonialRepository.restoreById as jest.Mock).mockResolvedValue(
        testimonial,
      );

      await expect(
        TestimonialService.restoreTestimonial(TESTIMONIAL_ID),
      ).resolves.toEqual(testimonial);
    });

    it('throws 404 when the testimonial is not deleted or does not exist', async () => {
      (TestimonialRepository.restoreById as jest.Mock).mockResolvedValue(null);

      await expect(
        TestimonialService.restoreTestimonial(TESTIMONIAL_ID),
      ).rejects.toMatchObject({
        status: httpStatus.NOT_FOUND,
        message: 'Testimonial not found or not deleted',
      });
    });
  });
});
