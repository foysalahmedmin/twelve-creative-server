import { PageCta } from '../../modules/page-cta/page-cta.model';
import { TPageCta } from '../../modules/page-cta/page-cta.type';

export const PAGE_CTA_SEED: Omit<
  TPageCta,
  '_id' | 'created_at' | 'updated_at'
>[] = [
  {
    placement: 'home',
    industry: null,
    eyebrow: "Let's build it",
    title: 'Need more than marketing activity?',
    description:
      'If your business needs clearer positioning, stronger creative, better distribution, and a system that supports real follow-up — Twelve Creative can help build the structure.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: { label: 'See the Process', href: '/process' },
    is_active: true,
  },
  {
    placement: 'what-we-build',
    industry: null,
    title: 'Need more than marketing activity?',
    description:
      'If your business needs clearer positioning, stronger creative, better distribution, and a system that supports real follow-up — Twelve Creative can help build the structure.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
  {
    placement: 'industries',
    industry: null,
    title: 'Working in one of these industries?',
    description:
      'We understand the buying decision in hospitality, real estate, aviation, and professional services — where credibility, taste, and follow-up directly impact revenue.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
  {
    placement: 'process',
    industry: null,
    title: 'Ready to start with clarity?',
    description:
      'We do not begin by making random assets. We begin by understanding what the business is trying to move, where the friction is, and what structure needs to be built.',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Request a Diagnostic', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
  {
    placement: 'works',
    industry: null,
    title: 'Want this kind of structure for your business?',
    description:
      'Our work is measured by whether the business becomes clearer, more credible, and better equipped to convert attention into action.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
  {
    placement: 'about',
    industry: null,
    title: 'Want to talk to Carlos directly?',
    description:
      'Tell us what you are building, where the business is now, and what needs to move next. If it is a fit, we will schedule a conversation.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
  {
    placement: 'industry-detail',
    industry: null,
    title: 'Want to talk to Carlos directly?',
    description:
      'Tell us what you are building, where the business is now, and what needs to move next. If it is a fit, we will schedule a conversation.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=600&fit=crop&auto=format',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: null,
    is_active: true,
  },
];

export type TPageCtaSeedReport = {
  module: 'page-ctas';
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
};

export async function seedPageCtas(
  force: boolean,
): Promise<TPageCtaSeedReport> {
  if (force) {
    await PageCta.deleteMany({});
    await PageCta.insertMany(PAGE_CTA_SEED);
    return {
      module: 'page-ctas',
      action: 'replaced',
      count: PAGE_CTA_SEED.length,
    };
  }

  const existing = await PageCta.find({ industry: null })
    .select('placement -_id')
    .lean();
  const existingPlacements = new Set(existing.map((item) => item.placement));
  const missing = PAGE_CTA_SEED.filter(
    (item) => !existingPlacements.has(item.placement),
  );

  if (!missing.length) {
    return {
      module: 'page-ctas',
      action: 'skipped',
      count: PAGE_CTA_SEED.length,
    };
  }

  await PageCta.insertMany(missing);
  return { module: 'page-ctas', action: 'inserted', count: missing.length };
}
