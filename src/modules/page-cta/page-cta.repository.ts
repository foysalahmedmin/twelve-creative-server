import { PageCta } from './page-cta.model';

/** Used by Industry deletion guards to prevent orphaned CTA overrides. */
export const countByIndustry = async (industryId: string): Promise<number> =>
  await PageCta.countDocuments({ industry: industryId });
