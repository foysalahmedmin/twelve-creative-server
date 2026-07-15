import { Types } from 'mongoose';
import {
  buildIndustryMediaDocuments,
  FEATURED_PROJECT_SEEDS,
  INDUSTRY_REEL_MEDIA_SEEDS,
  REQUIRED_INDUSTRY_SLUGS,
  SHOWCASE_VIDEO_SEEDS,
  type IndustrySeedSlug,
} from '../seeds/industry-media.seed';

const buildIndustryIds = (): Map<IndustrySeedSlug, Types.ObjectId> =>
  new Map(REQUIRED_INDUSTRY_SLUGS.map((slug) => [slug, new Types.ObjectId()]));

describe('industry media seed manifest', () => {
  it('defines the expected replacement counts', () => {
    expect(FEATURED_PROJECT_SEEDS).toHaveLength(16);
    expect(SHOWCASE_VIDEO_SEEDS).toHaveLength(14);
  });

  it('defines complete portrait reel media for every seeded Industry', () => {
    expect(Object.keys(INDUSTRY_REEL_MEDIA_SEEDS).sort()).toEqual(
      [...REQUIRED_INDUSTRY_SLUGS].sort(),
    );

    for (const slug of REQUIRED_INDUSTRY_SLUGS) {
      const media = INDUSTRY_REEL_MEDIA_SEEDS[slug];
      expect(media.reel_thumbnail).toContain('w=720&h=1280');
      expect(media.reel_video).toMatchObject({
        source: 'url',
        value: expect.stringMatching(/^https:\/\//),
      });
    }
  });

  it('defines four Featured Projects per Industry with scoped unique order', () => {
    for (const slug of REQUIRED_INDUSTRY_SLUGS) {
      const projects = FEATURED_PROJECT_SEEDS.filter(
        (project) => project.industry_slug === slug,
      );
      expect(projects).toHaveLength(4);
      expect(projects.map((project) => project.order).sort()).toEqual([
        1, 2, 3, 4,
      ]);
    }
  });

  it('defines unique Showcase order within each Industry and aspect', () => {
    const keys = SHOWCASE_VIDEO_SEEDS.map(
      (video) => `${video.industry_slug}:${video.aspect}:${video.order}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('replaces seed-only slugs with BSON Industry references', () => {
    const ids = buildIndustryIds();
    const { featuredProjects, showcaseVideos } =
      buildIndustryMediaDocuments(ids);

    for (const document of [...featuredProjects, ...showcaseVideos]) {
      expect(document.industry).toBeInstanceOf(Types.ObjectId);
      expect(document).not.toHaveProperty('industry_slug');
    }
  });

  it('fails before building documents when an Industry mapping is missing', () => {
    const ids = buildIndustryIds();
    ids.delete('hospitality');
    expect(() => buildIndustryMediaDocuments(ids)).toThrow(
      'Missing resolved Industry ID',
    );
  });
});
