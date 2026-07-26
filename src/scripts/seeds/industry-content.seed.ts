import type { Types } from 'mongoose';
import { Testimonial } from '../../modules/testimonial/testimonial.model';
import { Work } from '../../modules/work/work.model';
import type { IndustryIdMap, IndustrySeedSlug } from './industry-media.seed';

const TESTIMONIAL_INDUSTRY_BY_NAME = {
  'Elena Marchetti': 'hospitality',
  'Daniel Hartwell': 'real-estate',
  'Marcus Reid': 'aviation',
  'Priya Anand': 'professional-services',
  'Jacob Nguyen': 'hospitality',
  'Sofia Reyes': 'real-estate',
  'Aaron Whitfield': 'aviation',
  'Naomi Brooks': 'professional-services',
} as const satisfies Record<string, IndustrySeedSlug>;

const WORK_INDUSTRY_BY_SLUG = {
  'hudson-hospitality': 'hospitality',
  'meridian-properties': 'real-estate',
  'skyline-charter': 'aviation',
} as const satisfies Record<string, IndustrySeedSlug>;

const getIndustryId = (
  industryIds: IndustryIdMap,
  slug: IndustrySeedSlug,
): Types.ObjectId => {
  const industryId = industryIds.get(slug);
  if (!industryId) {
    throw new Error(`Cannot seed content: Industry "${slug}" is missing.`);
  }
  return industryId;
};

export const attachIndustriesToTestimonials = <T extends { name: string }>(
  documents: readonly T[],
  industryIds: IndustryIdMap,
) =>
  documents.map((document) => {
    const slug =
      TESTIMONIAL_INDUSTRY_BY_NAME[
        document.name as keyof typeof TESTIMONIAL_INDUSTRY_BY_NAME
      ];
    if (!slug) {
      throw new Error(
        `No Industry seed mapping exists for testimonial "${document.name}".`,
      );
    }

    return { ...document, industry: getIndustryId(industryIds, slug) };
  });

export const attachIndustriesToWorks = <T extends { slug: string }>(
  documents: readonly T[],
  industryIds: IndustryIdMap,
) =>
  documents.map((document) => {
    const slug =
      WORK_INDUSTRY_BY_SLUG[
        document.slug as keyof typeof WORK_INDUSTRY_BY_SLUG
      ];
    if (!slug) {
      throw new Error(
        `No Industry seed mapping exists for work "${document.slug}".`,
      );
    }

    return { ...document, industry: getIndustryId(industryIds, slug) };
  });

type IndustryRelationBackfillReport = {
  testimonialCount: number;
  workCount: number;
};

/**
 * Safely migrates the known launch records without overwriting an Industry
 * that an administrator has already assigned. Unknown legacy records stop the
 * seed with an actionable error instead of being silently misclassified.
 */
export const backfillIndustryContentRelations = async (
  industryIds: IndustryIdMap,
): Promise<IndustryRelationBackfillReport> => {
  let testimonialCount = 0;
  let workCount = 0;
  const missingIndustry = {
    $or: [{ industry: { $exists: false } }, { industry: null }],
  };

  for (const [name, slug] of Object.entries(TESTIMONIAL_INDUSTRY_BY_NAME) as [
    string,
    IndustrySeedSlug,
  ][]) {
    const result = await Testimonial.updateMany(
      { ...missingIndustry, name },
      { $set: { industry: getIndustryId(industryIds, slug) } },
    );
    testimonialCount += result.modifiedCount;
  }

  for (const [slug, industrySlug] of Object.entries(WORK_INDUSTRY_BY_SLUG) as [
    string,
    IndustrySeedSlug,
  ][]) {
    const result = await Work.updateMany(
      { ...missingIndustry, slug },
      { $set: { industry: getIndustryId(industryIds, industrySlug) } },
    );
    workCount += result.modifiedCount;
  }

  const [unresolvedTestimonials, unresolvedWorks] = await Promise.all([
    Testimonial.find(missingIndustry).select('_id name').lean(),
    Work.find(missingIndustry).select('_id slug').lean(),
  ]);

  if (unresolvedTestimonials.length || unresolvedWorks.length) {
    const testimonialNames = unresolvedTestimonials
      .map((item) => `${item.name} (${item._id})`)
      .join(', ');
    const workSlugs = unresolvedWorks
      .map((item) => `${item.slug} (${item._id})`)
      .join(', ');
    throw new Error(
      [
        testimonialNames &&
          `Testimonials need an Industry assignment: ${testimonialNames}`,
        workSlugs && `Works need an Industry assignment: ${workSlugs}`,
      ]
        .filter(Boolean)
        .join(' | '),
    );
  }

  return { testimonialCount, workCount };
};
