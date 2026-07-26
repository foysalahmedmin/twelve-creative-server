jest.mock('../../industry/industry.repository');

import * as IndustryRepository from '../../industry/industry.repository';
import { Testimonial } from '../testimonial.model';
import * as TestimonialRepository from '../testimonial.repository';

const TESTIMONIAL_ID = '507f1f77bcf86cd799439031';

describe('TestimonialRepository.updateById', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses an explicit Mongo unset when category-specific fields must be cleared', async () => {
    const update = jest
      .spyOn(Testimonial, 'findByIdAndUpdate')
      .mockResolvedValue(null);

    await TestimonialRepository.updateById(
      TESTIMONIAL_ID,
      { category: 'message', message: 'A complete testimonial message.' },
      ['video_message', 'thumbnail'],
    );

    expect(update).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
      {
        $set: {
          category: 'message',
          message: 'A complete testimonial message.',
        },
        $unset: { video_message: 1, thumbnail: 1 },
      },
      { new: true, runValidators: true },
    );
  });
});

describe('TestimonialRepository.findPublic', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns nothing when no active Industry can own public testimonials', async () => {
    (IndustryRepository.findActiveIds as jest.Mock).mockResolvedValue([]);
    const find = jest.spyOn(Testimonial, 'find');

    await expect(TestimonialRepository.findPublic()).resolves.toEqual([]);

    expect(find).not.toHaveBeenCalled();
  });

  it('only queries testimonials owned by active Industries', async () => {
    const industryId = '507f1f77bcf86cd799439032';
    (IndustryRepository.findActiveIds as jest.Mock).mockResolvedValue([
      industryId,
    ]);
    const lean = jest.fn().mockResolvedValue([]);
    const sort = jest.fn().mockReturnValue({ lean });
    const populate = jest.fn().mockReturnValue({ sort });
    const find = jest
      .spyOn(Testimonial, 'find')
      .mockReturnValue({ populate } as never);

    await TestimonialRepository.findPublic();

    expect(find).toHaveBeenCalledWith({
      is_active: true,
      industry: { $in: [industryId] },
    });
  });
});
