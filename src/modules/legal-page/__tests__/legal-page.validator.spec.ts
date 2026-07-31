import { upsertLegalPageValidationSchema } from '../legal-page.validator';

// A minimal unpublished draft. Deliberately local rather than imported from
// LEGAL_PAGE_SEED: these tests assert the "cannot publish without an effective
// date" rule, and must not start passing or failing because the real policy
// copy was edited.
const draft = {
  slug: 'privacy-policy' as const,
  title: 'Privacy Policy',
  markdown: '# Privacy Policy\n\nDraft copy.',
  effective_date: null,
  seo: {
    title: 'Privacy Policy | Twelve Creative',
    description: 'Twelve Creative privacy policy and data practices.',
  },
  is_published: false,
};

describe('Legal page validation', () => {
  it('accepts safe unpublished drafts without an effective date', () => {
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: draft,
      }).success,
    ).toBe(true);
  });

  it('requires an effective date before publishing', () => {
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: { ...draft, is_published: true },
      }).success,
    ).toBe(false);
  });

  it('coerces a valid effective date for a published record', () => {
    const result = upsertLegalPageValidationSchema.safeParse({
      params: { slug: draft.slug },
      body: {
        ...draft,
        effective_date: '2026-07-27',
        is_published: true,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.effective_date).toBeInstanceOf(Date);
    }
  });

  it.each([
    true,
    false,
    0,
    1767225600000,
    '2026-02-30',
    '2026-13-01',
    '01/02/2026',
    '2026-01-01T25:00:00.000Z',
  ])(
    'rejects an invalid or over-coerced effective date %p',
    (effectiveDate) => {
      expect(
        upsertLegalPageValidationSchema.safeParse({
          params: { slug: draft.slug },
          body: {
            ...draft,
            effective_date: effectiveDate,
            is_published: true,
          },
        }).success,
      ).toBe(false);
    },
  );

  it('accepts the UTC ISO timestamp emitted by the admin form', () => {
    const result = upsertLegalPageValidationSchema.safeParse({
      params: { slug: draft.slug },
      body: {
        ...draft,
        effective_date: '2026-07-27T00:00:00.000Z',
        is_published: true,
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.effective_date?.toISOString()).toBe(
        '2026-07-27T00:00:00.000Z',
      );
    }
  });

  it.each([
    '<script>alert(1)</script>',
    '[Unsafe](javascript:alert(1))',
    '<iframe src="https://evil.example"></iframe>',
  ])('rejects unsafe Markdown source %s', (markdown) => {
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: { ...draft, markdown },
      }).success,
    ).toBe(false);
  });
});
