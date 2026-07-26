import {
  createPageCtaValidationSchema,
  publicPageCtaSchema,
  updatePageCtaValidationSchema,
} from '../page-cta.validator';

const body = {
  placement: 'industry-detail',
  industry: '507f1f77bcf86cd799439011',
  eyebrow: 'Start here',
  title: 'Ready to build?',
  description: 'Tell us what needs to move next.',
  image: '/uploads/images/cta.jpg',
  primary_cta: { label: 'Start a Conversation', href: '/contact' },
  secondary_cta: { label: 'See the Process', href: '/process' },
  is_active: true,
};

describe('Page CTA validation', () => {
  it('accepts a complete Industry override and trims managed copy', () => {
    const result = createPageCtaValidationSchema.safeParse({ body });
    expect(result.success).toBe(true);
  });

  it('only permits Industry references on industry-detail placement', () => {
    expect(
      createPageCtaValidationSchema.safeParse({
        body: { ...body, placement: 'home' },
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe images and CTA links', () => {
    expect(
      createPageCtaValidationSchema.safeParse({
        body: {
          ...body,
          image: '//evil.example/cta.jpg',
          primary_cta: { label: 'Bad', href: 'javascript:alert(1)' },
        },
      }).success,
    ).toBe(false);
  });

  it('accepts partial updates while preserving strict field validation', () => {
    expect(
      updatePageCtaValidationSchema.safeParse({
        params: { id: '507f1f77bcf86cd799439011' },
        body: { title: 'Updated title' },
      }).success,
    ).toBe(true);
    expect(
      updatePageCtaValidationSchema.safeParse({
        params: { id: 'bad' },
        body: { title: '' },
      }).success,
    ).toBe(false);
  });

  it('validates public placement and Industry slug query', () => {
    expect(
      publicPageCtaSchema.safeParse({
        params: { placement: 'industry-detail' },
        query: { industry_slug: 'real-estate' },
      }).success,
    ).toBe(true);
    expect(
      publicPageCtaSchema.safeParse({
        params: { placement: 'unknown' },
        query: { industry_slug: '../unsafe' },
      }).success,
    ).toBe(false);
  });
});
