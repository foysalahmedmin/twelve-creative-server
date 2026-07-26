import { LegalPage } from '../../modules/legal-page/legal-page.model';
import { TLegalPageInput } from '../../modules/legal-page/legal-page.type';

/**
 * These records intentionally contain no invented legal terms. They stay
 * unpublished until the client supplies and approves final counsel-reviewed
 * language and an effective date.
 */
export const LEGAL_PAGE_SEED: TLegalPageInput[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    markdown:
      '# Privacy Policy\n\nThis draft is reserved for Twelve Creative’s approved privacy policy. Add counsel-reviewed content and an effective date before publishing.',
    effective_date: null,
    seo: {
      title: 'Privacy Policy | Twelve Creative',
      description: 'Twelve Creative privacy policy and data practices.',
    },
    is_published: false,
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    markdown:
      '# Terms and Conditions\n\nThis draft is reserved for Twelve Creative’s approved terms and conditions. Add counsel-reviewed content and an effective date before publishing.',
    effective_date: null,
    seo: {
      title: 'Terms and Conditions | Twelve Creative',
      description: 'Terms governing the use of Twelve Creative services.',
    },
    is_published: false,
  },
];

export type TLegalPageSeedReport = {
  module: 'legal-pages';
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
};

export async function seedLegalPages(
  force: boolean,
): Promise<TLegalPageSeedReport> {
  if (force) {
    await LegalPage.deleteMany({});
    await LegalPage.insertMany(LEGAL_PAGE_SEED);
    return {
      module: 'legal-pages',
      action: 'replaced',
      count: LEGAL_PAGE_SEED.length,
    };
  }

  const existing = await LegalPage.find().select('slug -_id').lean();
  const slugs = new Set(existing.map((item) => item.slug));
  const missing = LEGAL_PAGE_SEED.filter((item) => !slugs.has(item.slug));
  if (!missing.length) {
    return {
      module: 'legal-pages',
      action: 'skipped',
      count: LEGAL_PAGE_SEED.length,
    };
  }

  await LegalPage.insertMany(missing);
  return { module: 'legal-pages', action: 'inserted', count: missing.length };
}
