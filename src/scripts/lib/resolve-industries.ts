import type { ClientSession, Types } from 'mongoose';
import { Industry } from '../../modules/industry/industry.model';
import {
  REQUIRED_INDUSTRY_SLUGS,
  type IndustryIdMap,
  type IndustrySeedSlug,
} from '../seeds/industry-media.seed';

type ResolveIndustryOptions = {
  session?: ClientSession;
  requireActive?: boolean;
};

export const resolveSeedIndustries = async (
  options: ResolveIndustryOptions = {},
): Promise<IndustryIdMap> => {
  const { session, requireActive = true } = options;
  const filter: Record<string, unknown> = {
    slug: { $in: REQUIRED_INDUSTRY_SLUGS },
  };
  if (requireActive) filter.is_active = true;

  const query = Industry.find(filter).select('_id slug is_active').lean();
  if (session) query.session(session);

  const industries = await query.exec();
  const industryIds = new Map<IndustrySeedSlug, Types.ObjectId>();

  for (const industry of industries) {
    const slug = industry.slug as IndustrySeedSlug;
    if (!REQUIRED_INDUSTRY_SLUGS.includes(slug)) continue;
    if (industryIds.has(slug)) {
      throw new Error(`Duplicate Industry slug found: "${slug}"`);
    }
    industryIds.set(slug, industry._id as Types.ObjectId);
  }

  const missing = REQUIRED_INDUSTRY_SLUGS.filter(
    (slug) => !industryIds.has(slug),
  );
  if (missing.length) {
    throw new Error(
      `Required active Industries are missing: ${missing.join(', ')}`,
    );
  }

  return industryIds;
};
