/**
 * Industry seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

import { landscapeVideo } from '../lib/sample-media';
import { INDUSTRY_REEL_MEDIA_SEEDS } from './industry-media.seed';

export const INDUSTRY_SEED = [
  {
    slug: 'hospitality',
    name: 'Hospitality',
    headline: 'Hospitality marketing that understands the room.',
    description:
      'Restaurants and hospitality brands grow when experience, menu, atmosphere, events, and local market all work together. We help connect the moments to revenue.',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'hospitality' as const,
    work: [
      'Restaurant content',
      'Chef features',
      'Wine dinner campaigns',
      'Reservations strategy',
      'Influencer coordination',
      'Event promotion',
    ],
    order: 2,
    is_active: true,
    tagline: 'Seats filled. Tables turned.',
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop&auto=format',
    video: landscapeVideo(),
    ...INDUSTRY_REEL_MEDIA_SEEDS.hospitality,
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    headline: 'Real estate marketing needs more than beautiful renders.',
    description:
      'Developments, luxury properties, and commercial spaces need to be positioned correctly before they are promoted. We turn projects into clear, credible campaigns.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    icon: 'real-estate' as const,
    work: [
      'Project positioning',
      'Sales decks',
      'Property films',
      'Broker-facing assets',
      'Lead generation',
      'CRM and follow-up',
    ],
    order: 1,
    is_active: true,
    tagline: 'From listing to sellout.',
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=675&fit=crop&auto=format',
    video: landscapeVideo(),
    ...INDUSTRY_REEL_MEDIA_SEEDS['real-estate'],
  },
  {
    slug: 'ventures',
    name: 'Ventures',
    headline: 'High-trust marketing for high-value decisions.',
    description:
      'Private aviation is relationship-driven and credibility-dependent. We build positioning, content, funnels, and systems to support serious conversations.',
    image:
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=800&q=80',
    icon: 'aviation' as const,
    work: [
      'Founder content',
      'Charter campaigns',
      'Landing pages',
      'Lead funnels',
      'Qualification forms',
      'CRM systems',
    ],
    order: 3,
    is_active: true,
    tagline: 'Trust first. Revenue follows.',
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=675&fit=crop&auto=format',
    video: landscapeVideo(),
    ...INDUSTRY_REEL_MEDIA_SEEDS.ventures,
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    headline: 'Make expertise easier to understand.',
    description:
      'Professional service businesses often have real value but unclear communication. We translate expertise into a clearer message and stronger acquisition.',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    icon: 'professional-services' as const,
    work: [
      'Personal brand strategy',
      'Service positioning',
      'Educational content',
      'Lead funnels',
      'CRM setup',
      'Paid campaigns',
    ],
    order: 4,
    is_active: true,
    tagline: 'Clarity converts.',
    thumbnail:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=675&fit=crop&auto=format',
    video: landscapeVideo(),
    ...INDUSTRY_REEL_MEDIA_SEEDS['professional-services'],
  },
];
