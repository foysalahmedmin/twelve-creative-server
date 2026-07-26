import {
  createTestimonialValidationSchema,
  publicTestimonialsQuerySchema,
  reorderTestimonialsValidationSchema,
} from '../testimonial.validator';

const INDUSTRY_ID = '507f1f77bcf86cd799439031';

describe('testimonial validation', () => {
  it('requires an Industry when creating a testimonial', () => {
    const result = createTestimonialValidationSchema.safeParse({
      body: {
        name: 'Jordan Lee',
        designation: 'Founder',
        image: '/uploads/jordan.jpg',
        category: 'message',
        message: 'A testimonial long enough to be valid.',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts an Industry relation and normalizes the public slug filter', () => {
    expect(
      createTestimonialValidationSchema.safeParse({
        body: {
          industry: INDUSTRY_ID,
          name: 'Jordan Lee',
          designation: 'Founder',
          image: '/uploads/jordan.jpg',
          category: 'message',
          message: 'A testimonial long enough to be valid.',
        },
      }).success,
    ).toBe(true);

    const query = publicTestimonialsQuerySchema.parse({
      query: { industry_slug: ' Hospitality ' },
    });
    expect(query.query.industry_slug).toBe('hospitality');
  });

  it('rejects executable media references', () => {
    expect(
      createTestimonialValidationSchema.safeParse({
        body: {
          industry: INDUSTRY_ID,
          name: 'Jordan Lee',
          designation: 'Founder',
          image: 'javascript:alert(1)',
          category: 'message',
          message: 'A testimonial long enough to be valid.',
        },
      }).success,
    ).toBe(false);
  });

  it('bounds reorder payloads', () => {
    expect(
      reorderTestimonialsValidationSchema.safeParse({
        body: {
          items: Array.from({ length: 101 }, (_, order) => ({
            _id: INDUSTRY_ID,
            order,
          })),
        },
      }).success,
    ).toBe(false);
  });
});
