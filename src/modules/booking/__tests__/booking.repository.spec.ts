import { Booking } from '../booking.model';
import * as BookingRepository from '../booking.repository';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';

describe('BookingRepository Industry references', () => {
  afterEach(() => jest.restoreAllMocks());

  it('counts historical Booking references without applying a deleted filter', async () => {
    const countDocuments = jest
      .spyOn(Booking, 'countDocuments')
      .mockResolvedValue(2 as never);

    await expect(BookingRepository.countByIndustry(INDUSTRY_ID)).resolves.toBe(
      2,
    );
    expect(countDocuments).toHaveBeenCalledWith({ industry_id: INDUSTRY_ID });
  });

  it('has an index whose leading field supports Industry reference counts', () => {
    const indexes = Booking.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ industry_id: 1, created_at: -1 });
  });
});
