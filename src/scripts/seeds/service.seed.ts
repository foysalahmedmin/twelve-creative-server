/**
 * Service seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

export const SERVICE_SEED = [
  {
    slug: 'positioning',
    title: 'Positioning & Strategy',
    description:
      'We clarify what the business is, who it serves, why it matters, and how it should be presented to the market.',
    highlights: [
      'Brand messaging',
      'Offer structure',
      'Sales positioning',
      'Market differentiation',
    ],
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=552&fit=crop&auto=format',
    icon: 'positioning' as const,
    order: 1,
    is_active: true,
  },
  {
    slug: 'creative',
    title: 'Creative Production',
    description:
      'We create the visual assets that make the business feel credible, relevant, and worth paying attention to.',
    highlights: [
      'Video production',
      'Photography',
      'Short-form content',
      'Brand films',
    ],
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=768&h=552&fit=crop&auto=format',
    icon: 'creative' as const,
    order: 2,
    is_active: true,
  },
  {
    slug: 'distribution',
    title: 'Ads & Distribution',
    description:
      'Creative only matters if it reaches the right people with the right intention. We make sure attention lands.',
    highlights: ['Meta ads', 'Retargeting', 'Email & SMS', 'Launch campaigns'],
    image:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=768&h=552&fit=crop&auto=format',
    icon: 'distribution' as const,
    order: 3,
    is_active: true,
  },
  {
    slug: 'websites',
    title: 'Websites & Landing Pages',
    description:
      'A website should explain the business clearly, guide the user, and connect to the systems behind it.',
    highlights: [
      'Website copy',
      'Landing pages',
      'Campaign pages',
      'Conversion structure',
    ],
    image:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=768&h=552&fit=crop&auto=format',
    icon: 'websites' as const,
    order: 4,
    is_active: true,
  },
  {
    slug: 'automation',
    title: 'CRM & Automation',
    description:
      'Leads should not disappear after they show interest. We install backend systems that capture and follow up.',
    highlights: [
      'CRM setup',
      'Lead pipelines',
      'Email & SMS sequences',
      'Tracking & reporting',
    ],
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=768&h=552&fit=crop&auto=format',
    icon: 'automation' as const,
    order: 5,
    is_active: true,
  },
  {
    slug: 'growth',
    title: 'Ongoing Growth Support',
    description:
      'We work as an embedded growth partner, translating ideas, events, and offers into organized execution.',
    highlights: [
      'Strategic operator',
      'Creative direction',
      'Campaign management',
      'Reporting & review',
    ],
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=768&h=552&fit=crop&auto=format',
    icon: 'growth' as const,
    order: 6,
    is_active: true,
  },
];
