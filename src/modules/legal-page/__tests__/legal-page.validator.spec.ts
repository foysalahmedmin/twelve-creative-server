import { LEGAL_PAGE_SEED } from '../../../scripts/seeds/legal-page.seed';
import { upsertLegalPageValidationSchema } from '../legal-page.validator';

describe('Legal page validation', () => {
  it('accepts safe unpublished drafts without an effective date', () => {
    const draft = LEGAL_PAGE_SEED[0];
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: draft,
      }).success,
    ).toBe(true);
  });

  it('requires an effective date before publishing', () => {
    const draft = LEGAL_PAGE_SEED[0];
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: { ...draft, is_published: true },
      }).success,
    ).toBe(false);
  });

  it('coerces a valid effective date for a published record', () => {
    const draft = LEGAL_PAGE_SEED[0];
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
      const draft = LEGAL_PAGE_SEED[0];
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
    const draft = LEGAL_PAGE_SEED[0];
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
    const draft = LEGAL_PAGE_SEED[0];
    expect(
      upsertLegalPageValidationSchema.safeParse({
        params: { slug: draft.slug },
        body: { ...draft, markdown },
      }).success,
    ).toBe(false);
  });
});
