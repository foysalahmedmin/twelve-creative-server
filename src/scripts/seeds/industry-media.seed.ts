import type { Types } from 'mongoose';

export const REQUIRED_INDUSTRY_SLUGS = [
  'hospitality',
  'real-estate',
  'ventures',
  'professional-services',
] as const;

export type IndustrySeedSlug = (typeof REQUIRED_INDUSTRY_SLUGS)[number];

type VideoSource = 'youtube' | 'url' | 'upload';
type MediaAspect = 'reel' | 'landscape';

type VideoRef = {
  source: VideoSource;
  value: string;
};

export type IndustryReelMediaSeed = {
  reel_thumbnail: string;
  reel_video: VideoRef;
};

export type FeaturedProjectSeedDefinition = {
  industry_slug: IndustrySeedSlug;
  title: string;
  aspect: MediaAspect;
  thumbnail: string;
  video: VideoRef;
  order: number;
  is_active: boolean;
};

export type ShowcaseVideoSeedDefinition = {
  industry_slug: IndustrySeedSlug;
  video: VideoRef;
  thumbnail: string;
  alt: string;
  aspect: MediaAspect;
  order: number;
  is_active: boolean;
};

const SAMPLE_VIDEO =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const sampleVideo = (): VideoRef => ({ source: 'url', value: SAMPLE_VIDEO });

/**
 * Canonical reel media for the four launch Industries. Keeping this manifest
 * beside the related media seed lets both the initial seed and the idempotent
 * production patch use exactly the same values.
 */
export const INDUSTRY_REEL_MEDIA_SEEDS = {
  hospitality: {
    reel_thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=720&h=1280&fit=crop&auto=format',
    reel_video: sampleVideo(),
  },
  'real-estate': {
    reel_thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=720&h=1280&fit=crop&auto=format',
    reel_video: sampleVideo(),
  },
  ventures: {
    reel_thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=720&h=1280&fit=crop&auto=format',
    reel_video: sampleVideo(),
  },
  'professional-services': {
    reel_thumbnail:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=720&h=1280&fit=crop&auto=format',
    reel_video: sampleVideo(),
  },
} satisfies Record<IndustrySeedSlug, IndustryReelMediaSeed>;

export const FEATURED_PROJECT_SEEDS: FeaturedProjectSeedDefinition[] = [
  {
    industry_slug: 'hospitality',
    title: 'Chef Spotlight — Wine Dinner Series',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    title: 'Rooftop Opening — Hudson Hospitality',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    title: 'Menu Launch — Casa del Mar',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    title: 'Private Dining Experience — The Meridian',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=675&h=1200&fit=crop&auto=format',
    video: sampleVideo(),
    order: 4,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    title: 'Meridian Tower — Sales Film',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    title: 'Atlas Developments — Project Reveal',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    title: 'Obsidian — Luxury Property Tour',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    title: 'Penthouse Launch — Horizon Living',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=675&h=1200&fit=crop&auto=format',
    video: sampleVideo(),
    order: 4,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    title: 'Velocity Aviation — Charter Film',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    title: 'Skyline Charter — Founder Story',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    title: 'Northstar — Operations Behind the Scenes',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    title: 'Elite Travel — Apex Air',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=675&h=1200&fit=crop&auto=format',
    video: sampleVideo(),
    order: 4,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    title: 'Founder Talk — Brightline Advisors',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    title: 'Operator Interview — Forge Advisors',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    title: 'Monarch Consulting — Expertise on Camera',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=675&fit=crop&auto=format',
    video: sampleVideo(),
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    title: 'Strategy Session — Pinnacle Group',
    aspect: 'reel',
    thumbnail:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=675&h=1200&fit=crop&auto=format',
    video: sampleVideo(),
    order: 4,
    is_active: true,
  },
];

export const SHOWCASE_VIDEO_SEEDS: ShowcaseVideoSeedDefinition[] = [
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=512&h=912&fit=crop&auto=format',
    alt: 'Hospitality brand film — restaurant interior',
    aspect: 'reel',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=512&h=912&fit=crop&auto=format',
    alt: 'Real estate project reveal — luxury residential',
    aspect: 'reel',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=512&h=912&fit=crop&auto=format',
    alt: 'Aviation charter — founder film',
    aspect: 'reel',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=512&h=912&fit=crop&auto=format',
    alt: 'Restaurant menu launch — campaign asset',
    aspect: 'reel',
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=512&h=912&fit=crop&auto=format',
    alt: 'Founder interview — professional services',
    aspect: 'reel',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=512&h=912&fit=crop&auto=format',
    alt: 'Aviation hangar walkthrough — charter brand',
    aspect: 'reel',
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=512&h=912&fit=crop&auto=format',
    alt: 'Cocktail bar opening — hospitality teaser',
    aspect: 'reel',
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=512&h=912&fit=crop&auto=format',
    alt: 'Luxury property reveal — penthouse tour',
    aspect: 'reel',
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280&h=720&fit=crop&auto=format',
    alt: 'Hudson Hospitality — opening night recap',
    aspect: 'landscape',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'real-estate',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&h=720&fit=crop&auto=format',
    alt: 'Meridian Properties — project reveal',
    aspect: 'landscape',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'ventures',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1280&h=720&fit=crop&auto=format',
    alt: 'Skyline Charter — founder interview',
    aspect: 'landscape',
    order: 1,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280&h=720&fit=crop&auto=format',
    alt: 'Vesta Group — year in review',
    aspect: 'landscape',
    order: 2,
    is_active: true,
  },
  {
    industry_slug: 'hospitality',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1280&h=720&fit=crop&auto=format',
    alt: 'Casa del Mar — brand story',
    aspect: 'landscape',
    order: 3,
    is_active: true,
  },
  {
    industry_slug: 'professional-services',
    video: sampleVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1280&h=720&fit=crop&auto=format',
    alt: 'Monarch Consulting — founder film',
    aspect: 'landscape',
    order: 1,
    is_active: true,
  },
];

export type IndustryIdMap = ReadonlyMap<IndustrySeedSlug, Types.ObjectId>;

const getIndustryId = (
  industryIds: IndustryIdMap,
  slug: IndustrySeedSlug,
): Types.ObjectId => {
  const id = industryIds.get(slug);
  if (!id) throw new Error(`Missing resolved Industry ID for slug "${slug}"`);
  return id;
};

export const buildIndustryMediaDocuments = (industryIds: IndustryIdMap) => ({
  featuredProjects: FEATURED_PROJECT_SEEDS.map(
    ({ industry_slug, ...project }) => ({
      ...project,
      industry: getIndustryId(industryIds, industry_slug),
    }),
  ),
  showcaseVideos: SHOWCASE_VIDEO_SEEDS.map(({ industry_slug, ...video }) => ({
    ...video,
    industry: getIndustryId(industryIds, industry_slug),
  })),
});
