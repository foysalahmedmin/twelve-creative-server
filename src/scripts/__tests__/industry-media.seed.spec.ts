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
        source: 'youtube',
        value: expect.stringMatching(
          /^https:\/\/(www\.youtube\.com|youtu\.be)\//,
        ),
      });
    }
  });

  // The previous placeholders were hot-linked sample .mp4s whose hosts later
  // stopped serving them, leaving a freshly seeded site full of dead players.
  // These assertions are about that failure, not about the specific clips:
  // every seeded video must be playable and pointed at the orientation it is
  // actually rendered in.
  it('seeds only playable placeholder videos, matched to their aspect', () => {
    const REEL = 'https://www.youtube.com/shorts/sOxloXyOAKA';
    const LANDSCAPE = 'https://youtu.be/668nUCeBHyY';

    const withAspect = [...FEATURED_PROJECT_SEEDS, ...SHOWCASE_VIDEO_SEEDS];
    expect(withAspect.length).toBeGreaterThan(0);

    for (const item of withAspect) {
      expect(item.video.source).toBe('youtube');
      expect(item.video.value).toBe(item.aspect === 'reel' ? REEL : LANDSCAPE);
    }

    // Industry reel media is portrait by definition — there is no aspect field
    // to consult, so it is asserted directly.
    for (const slug of REQUIRED_INDUSTRY_SLUGS) {
      expect(INDUSTRY_REEL_MEDIA_SEEDS[slug].reel_video.value).toBe(REEL);
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

  it('defines the intended Showcase aspect distribution per Industry', () => {
    const distribution = Object.fromEntries(
      REQUIRED_INDUSTRY_SLUGS.map((slug) => [
        slug,
        {
          reel: SHOWCASE_VIDEO_SEEDS.filter(
            (video) => video.industry_slug === slug && video.aspect === 'reel',
          ).length,
          landscape: SHOWCASE_VIDEO_SEEDS.filter(
            (video) =>
              video.industry_slug === slug && video.aspect === 'landscape',
          ).length,
        },
      ]),
    );

    expect(distribution).toEqual({
      hospitality: { reel: 3, landscape: 3 },
      'real-estate': { reel: 2, landscape: 1 },
      ventures: { reel: 2, landscape: 1 },
      'professional-services': { reel: 1, landscape: 1 },
    });
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
