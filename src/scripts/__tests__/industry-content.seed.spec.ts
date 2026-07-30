import { Types } from 'mongoose';
import {
  attachIndustriesToTestimonials,
  attachIndustriesToWorks,
} from '../seeds/industry-content.seed';
import {
  REQUIRED_INDUSTRY_SLUGS,
  type IndustrySeedSlug,
} from '../seeds/industry-media.seed';

const buildIndustryIds = (): Map<IndustrySeedSlug, Types.ObjectId> =>
  new Map(REQUIRED_INDUSTRY_SLUGS.map((slug) => [slug, new Types.ObjectId()]));

describe('Industry-owned content seed mapping', () => {
  it('maps every launch testimonial to its canonical Industry', () => {
    const industryIds = buildIndustryIds();
    const documents = attachIndustriesToTestimonials(
      [
        { name: 'Elena Marchetti' },
        { name: 'Daniel Hartwell' },
        { name: 'Marcus Reid' },
        { name: 'Priya Anand' },
        { name: 'Jacob Nguyen' },
        { name: 'Sofia Reyes' },
        { name: 'Aaron Whitfield' },
        { name: 'Naomi Brooks' },
      ],
      industryIds,
    );

    expect(documents.map((document) => document.industry)).toEqual([
      industryIds.get('hospitality'),
      industryIds.get('real-estate'),
      industryIds.get('ventures'),
      industryIds.get('professional-services'),
      industryIds.get('hospitality'),
      industryIds.get('real-estate'),
      industryIds.get('ventures'),
      industryIds.get('professional-services'),
    ]);
  });

  it('maps every launch case study to its canonical Industry', () => {
    const industryIds = buildIndustryIds();
    const documents = attachIndustriesToWorks(
      [
        { slug: 'hudson-hospitality' },
        { slug: 'meridian-properties' },
        { slug: 'skyline-charter' },
      ],
      industryIds,
    );

    expect(documents.map((document) => document.industry)).toEqual([
      industryIds.get('hospitality'),
      industryIds.get('real-estate'),
      industryIds.get('ventures'),
    ]);
  });

  it('fails closed when a new seed record has no explicit mapping', () => {
    const industryIds = buildIndustryIds();
    expect(() =>
      attachIndustriesToTestimonials(
        [{ name: 'Unreviewed Client' }],
        industryIds,
      ),
    ).toThrow('No Industry seed mapping');
    expect(() =>
      attachIndustriesToWorks([{ slug: 'unreviewed-work' }], industryIds),
    ).toThrow('No Industry seed mapping');
  });
});
