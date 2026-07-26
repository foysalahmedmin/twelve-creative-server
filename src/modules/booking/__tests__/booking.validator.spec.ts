import {
  adminBookingsQuerySchema,
  createBookingValidationSchema,
} from '../booking.validator';

const INDUSTRY_ID = '507f1f77bcf86cd799439031';

describe('booking validation', () => {
  it('accepts a relational Industry and its display snapshot', () => {
    expect(
      createBookingValidationSchema.safeParse({
        body: {
          name: 'Taylor Smith',
          email: 'taylor@example.com',
          industry_id: INDUSTRY_ID,
          industry_name_snapshot: 'Hospitality',
        },
      }).success,
    ).toBe(true);
  });

  it('keeps the Other fallback valid without a relation', () => {
    expect(
      createBookingValidationSchema.safeParse({
        body: {
          name: 'Taylor Smith',
          email: 'taylor@example.com',
          industry_name_snapshot: 'Other',
        },
      }).success,
    ).toBe(true);
  });

  it('rejects malformed Industry identifiers', () => {
    expect(
      createBookingValidationSchema.safeParse({
        body: {
          name: 'Taylor Smith',
          email: 'taylor@example.com',
          industry_id: 'hospitality',
        },
      }).success,
    ).toBe(false);
  });

  describe('admin list query', () => {
    it('accepts bounded pagination and supported filters, sorting, and fields', () => {
      const result = adminBookingsQuerySchema.safeParse({
        query: {
          search: 'Taylor',
          page: '2',
          limit: '50',
          filter: 'pending',
          status: 'pending',
          industry_id: INDUSTRY_ID,
          lead_source: 'referral',
          sort: '-created_at,name',
          fields: 'name,email,status,-_id',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(50);
      }
    });

    it.each([
      [{ page: '0' }, 'non-positive page'],
      [{ page: '100001' }, 'unbounded page'],
      [{ limit: '0' }, 'non-positive limit'],
      [{ limit: '101' }, 'oversized limit'],
      [{ status: 'deleted' }, 'unknown status'],
      [{ sort: '-password' }, 'unknown sort field'],
      [{ fields: 'name,password' }, 'unknown selected field'],
      [{ fields: 'name,-internal_note' }, 'mixed projection modes'],
      [{ unexpected: 'value' }, 'unknown query key'],
      [
        { filter: 'pending', status: 'completed' },
        'conflicting status selectors',
      ],
    ] as Array<[Record<string, string>, string]>)(
      'rejects %s (%s)',
      (query) => {
        expect(adminBookingsQuerySchema.safeParse({ query }).success).toBe(
          false,
        );
      },
    );

    it('rejects an oversized search term and duplicate sort fields', () => {
      expect(
        adminBookingsQuerySchema.safeParse({
          query: { search: 'x'.repeat(201) },
        }).success,
      ).toBe(false);
      expect(
        adminBookingsQuerySchema.safeParse({
          query: { sort: 'created_at,-created_at' },
        }).success,
      ).toBe(false);
    });
  });
});
