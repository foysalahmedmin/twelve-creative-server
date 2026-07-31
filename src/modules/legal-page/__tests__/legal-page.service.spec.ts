jest.mock('../legal-page.model', () => ({
  LegalPage: {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import httpStatus from 'http-status';
import { LegalPage } from '../legal-page.model';
import * as LegalPageService from '../legal-page.service';

// Local fixtures rather than LEGAL_PAGE_SEED: these tests assert the
// "cannot publish without an effective date" rule and must not change
// behaviour when the real policy copy is edited.
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

const published = {
  ...draft,
  markdown: '# Privacy\r\n\r\nApproved copy.  ',
  effective_date: new Date('2026-07-27'),
  is_published: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-02'),
};

describe('LegalPageService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a published page through an explicit public allowlist', async () => {
    (LegalPage.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(published),
    });
    const result = await LegalPageService.getPublicLegalPage('privacy-policy');
    expect(result).toEqual({
      slug: published.slug,
      title: published.title,
      markdown: published.markdown,
      effective_date: published.effective_date,
      seo: published.seo,
    });
    expect(result).not.toHaveProperty('is_published');
    expect(result).not.toHaveProperty('updated_at');
  });

  it('rejects route/payload slug mismatches', async () => {
    await expect(
      LegalPageService.upsertLegalPage('terms-and-conditions', draft),
    ).rejects.toMatchObject({ status: httpStatus.BAD_REQUEST });
  });

  it('enforces an effective date at the service boundary', async () => {
    await expect(
      LegalPageService.upsertLegalPage('privacy-policy', {
        ...draft,
        is_published: true,
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'An effective date is required before publishing',
    });
  });

  it('normalizes Markdown line endings before atomic upsert', async () => {
    (LegalPage.findOneAndUpdate as jest.Mock).mockResolvedValue(published);
    await LegalPageService.upsertLegalPage('privacy-policy', published);
    expect(LegalPage.findOneAndUpdate).toHaveBeenCalledWith(
      { slug: 'privacy-policy' },
      {
        $set: expect.objectContaining({
          markdown: '# Privacy\n\nApproved copy.',
        }),
      },
      {
        upsert: true,
        new: true,
        lean: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  });
});
