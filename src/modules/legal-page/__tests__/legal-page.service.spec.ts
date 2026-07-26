jest.mock('../legal-page.model', () => ({
  LegalPage: {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import httpStatus from 'http-status';
import { LEGAL_PAGE_SEED } from '../../../scripts/seeds/legal-page.seed';
import { LegalPage } from '../legal-page.model';
import * as LegalPageService from '../legal-page.service';

const published = {
  ...LEGAL_PAGE_SEED[0],
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
      LegalPageService.upsertLegalPage(
        'terms-and-conditions',
        LEGAL_PAGE_SEED[0],
      ),
    ).rejects.toMatchObject({ status: httpStatus.BAD_REQUEST });
  });

  it('enforces an effective date at the service boundary', async () => {
    await expect(
      LegalPageService.upsertLegalPage('privacy-policy', {
        ...LEGAL_PAGE_SEED[0],
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
