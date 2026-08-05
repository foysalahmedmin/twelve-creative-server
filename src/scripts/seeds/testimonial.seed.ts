/**
 * Testimonial seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

import { reelVideo } from '../lib/sample-media';

export const TESTIMONIAL_SEED = [
  // Video testimonials
  {
    name: 'Elena Marchetti',
    designation: 'Owner, Casa del Mar Restaurant Group',
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format',
    category: 'video_message' as const,
    video_message: reelVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=768&h=512&fit=crop&auto=format',
    order: 1,
    is_active: true,
  },
  {
    name: 'Daniel Hartwell',
    designation: 'Founder, Meridian Properties',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&auto=format',
    category: 'video_message' as const,
    video_message: reelVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=768&h=512&fit=crop&auto=format',
    order: 2,
    is_active: true,
  },
  {
    name: 'Marcus Reid',
    designation: 'Director, Velocity Aviation',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
    category: 'video_message' as const,
    video_message: reelVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=768&h=512&fit=crop&auto=format',
    order: 3,
    is_active: true,
  },
  {
    name: 'Priya Anand',
    designation: 'Managing Partner, Brightline Advisors',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&auto=format',
    category: 'video_message' as const,
    video_message: reelVideo(),
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=768&h=512&fit=crop&auto=format',
    order: 4,
    is_active: true,
  },
  // Text testimonials
  {
    name: 'Jacob Nguyen',
    designation: 'Chef & Partner, Hudson Hospitality',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&auto=format',
    category: 'message' as const,
    message:
      'Before Twelve Creative, our content was inconsistent and reservations were unpredictable. Within months, the brand felt sharper and the calendar started filling itself.',
    order: 5,
    is_active: true,
  },
  {
    name: 'Sofia Reyes',
    designation: 'VP Marketing, Atlas Developments',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&auto=format',
    category: 'message' as const,
    message:
      'They positioned the project, built the film, ran the campaign, and installed the CRM. We finally saw the path from interest to qualified buyer.',
    order: 6,
    is_active: true,
  },
  {
    name: 'Aaron Whitfield',
    designation: 'Founder, Skyline Charter',
    image:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&auto=format',
    category: 'message' as const,
    message:
      'Aviation buyers move on trust. Twelve Creative built the founder content and follow-up system that finally matched the level of our service.',
    order: 7,
    is_active: true,
  },
  {
    name: 'Naomi Brooks',
    designation: 'Managing Director, Forge Advisors',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&auto=format',
    category: 'message' as const,
    message:
      'What we needed was structure — clearer message, stronger website, working follow-up. They delivered all of it as one connected system.',
    order: 8,
    is_active: true,
  },
];
