/**
 * Initial content seed for the Twelve Creative database.
 *
 * Populates every module that drives a public-facing surface so the site
 * never renders empty in a demo or fresh-launch scenario. Content mirrors
 * the static seed data the frontend used pre-backend (testimonials, videos,
 * works, brands, FAQs, team) plus 3 launch-ready Insight articles + the
 * site contact/socials singleton.
 *
 * Idempotent — by default each module is skipped if it already has any
 * non-deleted document. Pass `--force` to clear and reseed every module.
 *
 * Usage:
 *   pnpm seed:initial            # safe — only seeds empty modules
 *   pnpm seed:initial --force    # destructive — clears + reseeds everything
 *
 * Does NOT seed: users (use pnpm seed:admin), bookings, contact-messages
 * (those are user-submitted and should start empty).
 */

/* eslint-disable no-console */
import mongoose from 'mongoose';
import { disconnectDB, initializeDB } from '../config/db';
import { Brand } from '../modules/brand/brand.model';
import { Faq } from '../modules/faq/faq.model';
import { FeaturedProject } from '../modules/featured-project/featured-project.model';
import { Industry } from '../modules/industry/industry.model';
import { Insight } from '../modules/insight/insight.model';
import { Service } from '../modules/service/service.model';
import { ShowcaseVideo } from '../modules/showcase-video/showcase-video.model';
import { PageHero } from '../modules/page-hero/page-hero.model';
import { SiteSetting } from '../modules/site-setting/site-setting.model';
import { TeamMember } from '../modules/team-member/team-member.model';
import { Testimonial } from '../modules/testimonial/testimonial.model';
import { Work } from '../modules/work/work.model';

const FORCE = process.argv.includes('--force');

const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// ─── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  // Video testimonials
  {
    name: 'Elena Marchetti',
    designation: 'Owner, Casa del Mar Restaurant Group',
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&auto=format',
    category: 'video_message' as const,
    video_message: { source: 'url' as const, value: SAMPLE_VIDEO },
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
    video_message: { source: 'url' as const, value: SAMPLE_VIDEO },
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
    video_message: { source: 'url' as const, value: SAMPLE_VIDEO },
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
    video_message: { source: 'url' as const, value: SAMPLE_VIDEO },
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

// ─── Showcase Videos (Visual Library) ────────────────────────────────────────
// Showcase videos — split across two public surfaces by `aspect`:
//   - `reel`      → Visual Library marquee (portrait 9:16)
//   - `landscape` → Work Showcase thumbnail grid (16:9)
const SHOWCASE_VIDEOS = [
  // Reel videos (Visual Library)
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=512&h=912&fit=crop&auto=format',
    alt: 'Hospitality brand film — restaurant interior',
    aspect: 'reel' as const,
    order: 1,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=512&h=912&fit=crop&auto=format',
    alt: 'Real estate project reveal — luxury residential',
    aspect: 'reel' as const,
    order: 2,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=512&h=912&fit=crop&auto=format',
    alt: 'Aviation charter — founder film',
    aspect: 'reel' as const,
    order: 3,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=512&h=912&fit=crop&auto=format',
    alt: 'Restaurant menu launch — campaign asset',
    aspect: 'reel' as const,
    order: 4,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=512&h=912&fit=crop&auto=format',
    alt: 'Founder interview — professional services',
    aspect: 'reel' as const,
    order: 5,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=512&h=912&fit=crop&auto=format',
    alt: 'Aviation hangar walkthrough — charter brand',
    aspect: 'reel' as const,
    order: 6,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=512&h=912&fit=crop&auto=format',
    alt: 'Cocktail bar opening — hospitality teaser',
    aspect: 'reel' as const,
    order: 7,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=512&h=912&fit=crop&auto=format',
    alt: 'Luxury property reveal — penthouse tour',
    aspect: 'reel' as const,
    order: 8,
    is_active: true,
  },
  // Landscape videos (Work Showcase grid)
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280&h=720&fit=crop&auto=format',
    alt: 'Hudson Hospitality — opening night recap',
    aspect: 'landscape' as const,
    order: 9,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&h=720&fit=crop&auto=format',
    alt: 'Meridian Properties — project reveal',
    aspect: 'landscape' as const,
    order: 10,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1280&h=720&fit=crop&auto=format',
    alt: 'Skyline Charter — founder interview',
    aspect: 'landscape' as const,
    order: 11,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280&h=720&fit=crop&auto=format',
    alt: 'Vesta Group — year in review',
    aspect: 'landscape' as const,
    order: 12,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1280&h=720&fit=crop&auto=format',
    alt: 'Casa del Mar — brand story',
    aspect: 'landscape' as const,
    order: 13,
    is_active: true,
  },
  {
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    thumbnail:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1280&h=720&fit=crop&auto=format',
    alt: 'Monarch Consulting — founder film',
    aspect: 'landscape' as const,
    order: 14,
    is_active: true,
  },
];

// Featured Projects — 4 tabs matching the 4 industry verticals, 4 projects each.
const FEATURED_PROJECTS = [
  // Hospitality
  {
    title: 'Chef Spotlight — Wine Dinner Series',
    category: 'Hospitality',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 1,
    is_active: true,
  },
  {
    title: 'Rooftop Opening — Hudson Hospitality',
    category: 'Hospitality',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 2,
    is_active: true,
  },
  {
    title: 'Menu Launch — Casa del Mar',
    category: 'Hospitality',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 3,
    is_active: true,
  },
  {
    title: 'Private Dining Experience — The Meridian',
    category: 'Hospitality',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=675&h=1200&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 4,
    is_active: true,
  },
  // Real Estate
  {
    title: 'Meridian Tower — Sales Film',
    category: 'Real Estate',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 4,
    is_active: true,
  },
  {
    title: 'Atlas Developments — Project Reveal',
    category: 'Real Estate',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 5,
    is_active: true,
  },
  {
    title: 'Obsidian — Luxury Property Tour',
    category: 'Real Estate',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 6,
    is_active: true,
  },
  {
    title: 'Penthouse Launch — Horizon Living',
    category: 'Real Estate',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=675&h=1200&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 7,
    is_active: true,
  },
  // Aviation
  {
    title: 'Velocity Aviation — Charter Film',
    category: 'Aviation',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 7,
    is_active: true,
  },
  {
    title: 'Skyline Charter — Founder Story',
    category: 'Aviation',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 8,
    is_active: true,
  },
  {
    title: 'Northstar — Operations Behind the Scenes',
    category: 'Aviation',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 9,
    is_active: true,
  },
  {
    title: 'Elite Travel — Apex Air',
    category: 'Aviation',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=675&h=1200&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 10,
    is_active: true,
  },
  // Professional Services
  {
    title: 'Founder Talk — Brightline Advisors',
    category: 'Professional Services',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 10,
    is_active: true,
  },
  {
    title: 'Operator Interview — Forge Advisors',
    category: 'Professional Services',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 11,
    is_active: true,
  },
  {
    title: 'Monarch Consulting — Expertise on Camera',
    category: 'Professional Services',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 12,
    is_active: true,
  },
  {
    title: 'Strategy Session — Pinnacle Group',
    category: 'Professional Services',
    aspect: 'reel' as const,
    thumbnail:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=675&h=1200&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
    order: 13,
    is_active: true,
  },
];

// ─── Services ────────────────────────────────────────────────────────────────
// Drives the home page card grid + the /what-we-build alternating rows.
// Slug is the public anchor (/what-we-build#<slug>); icon picks the visual
// from SERVICE_ICON_MAP on the frontend.
const SERVICES = [
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

// ─── Industries ──────────────────────────────────────────────────────────────
// Drives the home page tab pills + the /industries grid. Slug doubles as the
// in-page anchor (/industries#<slug>). Icon enum is locked to four keys that
// match the frontend INDUSTRY_ICON_MAP.
const INDUSTRIES = [
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
    order: 1,
    is_active: true,
    tagline: 'Seats filled. Tables turned.',
    thumbnail:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
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
    order: 2,
    is_active: true,
    tagline: 'From listing to sellout.',
    thumbnail:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=675&fit=crop&auto=format',
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
  },
  {
    slug: 'aviation',
    name: 'Aviation',
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
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
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
    video: { source: 'url' as const, value: SAMPLE_VIDEO },
  },
];

// ─── Brands ──────────────────────────────────────────────────────────────────
// Wordmark logos via placehold.co — clean text-based placeholders the client
// can swap for real logos one by one through the admin UI.
const brandLogo = (name: string) =>
  `https://placehold.co/240x80/0a0a0a/ffffff?text=${encodeURIComponent(name)}`;

const BRANDS = [
  'Casa del Mar',
  'Hudson Hospitality',
  'Meridian Properties',
  'Atlas Developments',
  'Velocity Aviation',
  'Skyline Charter',
  'Forge Advisors',
  'Brightline Partners',
  'Vesta Group',
  'Obsidian Real Estate',
  'Northstar Aviation',
  'Monarch Consulting',
].map((name, index) => ({
  name,
  logo: brandLogo(name),
  order: index + 1,
  is_active: true,
}));

// ─── FAQs ────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    question: 'What does Twelve Creative actually do?',
    answer:
      'We build the marketing structure behind business growth. We work across positioning, creative production, distribution, websites, CRM, and automation — connecting these pieces so the business has a clearer path from attention to revenue.',
    group: 'General',
  },
  {
    question: 'How is Twelve Creative different from a typical agency?',
    answer:
      'Most agencies focus on one thing — content, ads, websites, or strategy. We build these pieces together. We look at the full path: how the business is positioned, how it is presented, how people discover it, and what happens after they show interest. The goal is a system, not just an activity.',
    group: 'General',
  },
  {
    question: 'What types of businesses do you work with?',
    answer:
      'Restaurant groups and hospitality brands, real estate developers and luxury property companies, private aviation and charter businesses, professional service firms, founders building personal brands connected to real offers, and companies without a full internal marketing department.',
    group: 'General',
  },
  {
    question: 'What does the process look like?',
    answer:
      'Understand the business, clarify the position, build the creative, launch distribution, install the system, and improve based on reality. We start with diagnosis, then move through positioning, creative, distribution, and backend installation — refining over time.',
    group: 'Process',
  },
  {
    question: 'How do we get started?',
    answer:
      'Submit an inquiry through the contact page. Tell us what you are building, where the business is now, and what needs to move. If the project is aligned, we will reach out to schedule a conversation.',
    group: 'Process',
  },
  {
    question: 'Do you work on a project basis or retainer?',
    answer:
      'Both. We offer defined project buildouts (System Install) for businesses that need a specific deliverable, and ongoing growth partnerships for companies that want embedded strategic and creative support over time.',
    group: 'Pricing',
  },
  {
    question: 'Do you show pricing on the website?',
    answer:
      'No. Every business is different. The scope, timeline, and investment depend on what needs to be built. The best first step is a conversation.',
    group: 'Pricing',
  },
  {
    question: 'What industries do you have the most experience in?',
    answer:
      'Hospitality — restaurants, lounges, rooftops, chefs, and hospitality groups. Real Estate — developers, luxury properties, commercial spaces. Aviation — private aviation brands and charter professionals. Professional Services — firms that depend on trust and referrals.',
    group: 'General',
  },
].map((faq, index) => ({ ...faq, order: index + 1, is_active: true }));

// ─── Team Members ────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: 'Carlos Doce',
    role: 'Founder, Twelve Creative',
    bio: 'Founder of Twelve Creative. 15+ years across film, production, and growth systems. NYU film + business.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&auto=format',
    socials: {
      linkedin: 'https://www.linkedin.com/in/carlosdoce',
    },
  },
  {
    name: 'Strategy Lead',
    role: 'Positioning & Offer',
    bio: 'Shapes the message, offer, and angle every campaign sits on top of.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=600&fit=crop&auto=format',
  },
  {
    name: 'Creative Director',
    role: 'Film & Photography',
    bio: 'Leads brand films, founder content, and the visual identity behind every project we ship.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop&auto=format',
  },
  {
    name: 'Distribution Lead',
    role: 'Paid Media & Campaigns',
    bio: 'Owns the channel mix — paid social, email, SMS, retargeting — and the analytics behind it.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop&auto=format',
  },
  {
    name: 'Systems Engineer',
    role: 'CRM & Automation',
    bio: 'Builds the backend that turns inbound interest into qualified, follow-through-ready conversations.',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=600&fit=crop&auto=format',
  },
  {
    name: 'Account Partner',
    role: 'Client Operations',
    bio: 'Day-to-day partner for clients — coordinates production, decisions, and timelines across teams.',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop&auto=format',
  },
].map((member, index) => ({ ...member, order: index + 1, is_active: true }));

// ─── Works (Case Studies) ────────────────────────────────────────────────────
const WORKS = [
  {
    slug: 'hudson-hospitality',
    type: 'Hospitality',
    title:
      'Helping a restaurant concept become easier to market — and eventually sell.',
    description:
      'A restaurant group had been trying to sell a sister concept for several years. Twelve Creative supported the brand with ongoing content, website updates, social, campaign execution, and a stronger digital presence — making the concept more visible, more organized, and more attractive in the market.',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280&h=720&fit=crop&auto=format',
    image_alt: 'Restaurant interior — Hudson Hospitality',
    metrics: [
      { label: 'Revenue', value: '+40%', sub: 'Year one growth' },
      { label: 'Timeline', value: '12 mo', sub: 'Engagement length' },
      { label: 'Outcome', value: '3 sites', sub: 'Successfully sold' },
      { label: 'Reach', value: '+220%', sub: 'Local awareness' },
    ],
    tag_slugs: ['Hospitality', 'Brand Films', 'Campaign Execution'],
    hero_stats: [
      { label: 'Revenue Growth', value: '+40%' },
      { label: 'Locations Sold', value: '3 of 3' },
    ],
    client: {
      name: 'Hudson Hospitality',
      industry: 'Restaurant Group',
      domain: 'hudsonhospitality.example',
      employees: '50-200',
      tags: ['Restaurant', 'Hospitality', 'Multi-location'],
      desc: 'A multi-concept restaurant group operating across hospitality categories — full-service dining, a sister pizzeria, and a private events space.',
      logo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=128&h=128&fit=crop&auto=format',
    },
    situation_intro:
      'The group was trying to sell their sister pizzeria concept. The concept had loyal regulars but inconsistent visibility, limited content, and a digital presence that did not match the quality of the in-room experience.',
    challenge_intro:
      'Make the concept easier to market, easier to talk about, and easier for buyers to evaluate — without compromising the existing guest experience.',
    challenge_items: [
      {
        title: 'Inconsistent content',
        desc: "Social and web content was sporadic, often inconsistent with the brand's actual quality.",
      },
      {
        title: 'Weak digital presence',
        desc: 'The website did not communicate the concept clearly to potential buyers or guests.',
      },
      {
        title: 'No campaign rhythm',
        desc: 'Seasonal moments and events were not being promoted in any organized way.',
      },
    ],
    solution_intro:
      'We installed a clear monthly content rhythm, sharpened the website, and ran campaigns around key seasonal moments — making the concept feel alive, organized, and credible.',
    solution_phases: [
      {
        phase: 'Positioning & Audit',
        time: 'Month 1',
        desc: "Clarified the concept's positioning, target guest, and the story buyers needed to believe.",
      },
      {
        phase: 'Website & Content Refresh',
        time: 'Month 2',
        desc: 'Updated the website with cleaner messaging, stronger photography, and clearer paths to reservations.',
      },
      {
        phase: 'Ongoing Production',
        time: 'Months 3-12',
        desc: 'Monthly content production, paid social campaigns, and email blasts tied to events and seasonal launches.',
      },
    ],
    outcome_desc:
      'After one year of working together, revenue increased by approximately 40%. The improved visibility and consistency helped attract buyers and contributed to the successful sale of all three locations.',
    outcome_video: { source: 'url' as const, value: SAMPLE_VIDEO },
    testimonial: {
      quote:
        "They didn't just make our content look better. They made the business easier to talk about — and easier to sell.",
      name: 'Elena Marchetti',
      role: 'Owner, Hudson Hospitality',
      avatar_url:
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=128&h=128&fit=crop&auto=format',
    },
    calendly_url: '/contact',
    order: 1,
    is_published: true,
  },
  {
    slug: 'meridian-properties',
    type: 'Real Estate',
    title: 'Turning a luxury development into a clear, credible buyer story.',
    description:
      'A real estate developer needed to position a new residential project for serious buyers and brokers. Twelve Creative built the positioning, sales film, broker assets, and lead system that supported the full sales cycle.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&h=720&fit=crop&auto=format',
    image_alt: 'Luxury residential development — Meridian Properties',
    metrics: [
      { label: 'Qualified Leads', value: '+145%', sub: 'Vs. prior launch' },
      { label: 'Sales Cycle', value: '-30%', sub: 'Time to commit' },
      { label: 'Broker Activity', value: '3×', sub: 'Engagement' },
      { label: 'Timeline', value: '6 mo', sub: 'Pre-launch to close' },
    ],
    tag_slugs: ['Real Estate', 'Sales Film', 'Lead Generation'],
    hero_stats: [
      { label: 'Qualified Leads', value: '+145%' },
      { label: 'Sales Cycle', value: '-30%' },
    ],
    client: {
      name: 'Meridian Properties',
      industry: 'Real Estate Development',
      domain: 'meridianproperties.example',
      employees: '20-50',
      tags: ['Luxury', 'Residential', 'Development'],
      desc: 'A real estate developer focused on luxury residential and mixed-use projects in coastal markets.',
      logo: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=128&h=128&fit=crop&auto=format',
    },
    situation_intro:
      'The team had a strong project but a weak presentation. Renders existed but the story did not — buyers and brokers struggled to understand the value quickly.',
    challenge_intro:
      'Turn the project into a clear, credible, marketable story — and connect that story to a real lead system.',
    challenge_items: [
      {
        title: 'Weak positioning',
        desc: "Marketing materials emphasized features instead of the buyer's reason to act.",
      },
      {
        title: 'No central lead path',
        desc: 'Inquiries were scattered across forms, brokers, and email — with no working CRM.',
      },
      {
        title: 'Broker-facing gaps',
        desc: 'Brokers had no premium materials to share with their networks.',
      },
    ],
    solution_intro:
      "We rebuilt the project's story end-to-end: positioning, sales film, broker assets, landing page, and CRM-backed lead system.",
    solution_phases: [
      {
        phase: 'Positioning',
        time: 'Weeks 1-2',
        desc: 'Defined the buyer profile, value angle, and core sales narrative.',
      },
      {
        phase: 'Sales Film & Assets',
        time: 'Weeks 3-6',
        desc: 'Produced a project film, broker decks, and a campaign-ready landing page.',
      },
      {
        phase: 'Lead System Install',
        time: 'Weeks 7-9',
        desc: 'Connected the landing page to a CRM with qualification, follow-up, and reporting.',
      },
    ],
    outcome_desc:
      'Qualified inquiries increased 145% versus the prior launch, and the average buyer commitment timeline compressed by roughly 30%. Brokers engaged the materials three times more than before.',
    outcome_video: { source: 'url' as const, value: SAMPLE_VIDEO },
    testimonial: {
      quote:
        'They positioned the project, built the film, ran the campaign, and installed the CRM. We finally saw the path from interest to qualified buyer.',
      name: 'Daniel Hartwell',
      role: 'Founder, Meridian Properties',
      avatar_url:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&auto=format',
    },
    calendly_url: '/contact',
    order: 2,
    is_published: true,
  },
  {
    slug: 'skyline-charter',
    type: 'Aviation',
    title: 'Building the trust infrastructure for a private aviation brand.',
    description:
      'A charter business needed to look and feel as serious as the service they delivered. We built the founder content, lead funnel, and follow-up system that matched their level — and started attracting the right conversations.',
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1280&h=720&fit=crop&auto=format',
    image_alt: 'Private aviation — Skyline Charter',
    metrics: [
      { label: 'Qualified Calls', value: '+180%', sub: 'Quarter over quarter' },
      { label: 'Inquiries', value: '+92%', sub: 'Inbound' },
      { label: 'Close Rate', value: '+22%', sub: 'On qualified' },
      { label: 'Timeline', value: '5 mo', sub: 'End-to-end build' },
    ],
    tag_slugs: ['Aviation', 'Founder Content', 'Lead Funnel'],
    hero_stats: [
      { label: 'Qualified Calls', value: '+180%' },
      { label: 'Close Rate', value: '+22%' },
    ],
    client: {
      name: 'Skyline Charter',
      industry: 'Private Aviation',
      domain: 'skylinecharter.example',
      employees: '10-50',
      tags: ['Charter', 'Aviation', 'Founder-led'],
      desc: 'A founder-led private aviation brand operating charter services for high-trust buyers and corporate clients.',
      logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=128&h=128&fit=crop&auto=format',
    },
    situation_intro:
      'The founder ran a serious operation but the marketing felt generic. Buyers landing on the site could not tell what made this charter different from any other listing.',
    challenge_intro:
      "Communicate trust, access, safety, and process — and create a qualification path that protected the founder's time.",
    challenge_items: [
      {
        title: 'Generic marketing',
        desc: 'Existing materials looked like every other charter listing — no clear differentiator.',
      },
      {
        title: 'No founder presence',
        desc: 'The founder was the trust anchor but never appeared in the content.',
      },
      {
        title: 'Wasted founder time',
        desc: 'Unqualified inquiries were eating into the founder’s focus on real deals.',
      },
    ],
    solution_intro:
      'We produced founder-led video content, rebuilt the inquiry path with qualification logic, and connected the system to automated follow-up.',
    solution_phases: [
      {
        phase: 'Founder Content',
        time: 'Weeks 1-3',
        desc: 'Filmed founder interviews and behind-the-scenes content that established trust.',
      },
      {
        phase: 'Qualification Funnel',
        time: 'Weeks 4-6',
        desc: 'Built an inquiry path that pre-qualified leads before reaching the founder.',
      },
      {
        phase: 'Automation & Follow-up',
        time: 'Weeks 7-8',
        desc: 'CRM, email sequences, and SMS reminders so no qualified lead fell through the cracks.',
      },
    ],
    outcome_desc:
      'Qualified calls increased 180% quarter over quarter while the founder spent less time on unqualified leads. Close rate on qualified opportunities improved by 22%.',
    outcome_video: { source: 'url' as const, value: SAMPLE_VIDEO },
    testimonial: {
      quote:
        'Aviation buyers move on trust. Twelve Creative built the founder content and follow-up system that finally matched the level of our service.',
      name: 'Aaron Whitfield',
      role: 'Founder, Skyline Charter',
      avatar_url:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=128&h=128&fit=crop&auto=format',
    },
    calendly_url: '/contact',
    order: 3,
    is_published: true,
  },
];

// ─── Insights / Blog Articles ────────────────────────────────────────────────
const INSIGHTS = [
  {
    slug: 'why-most-marketing-fails-structure',
    title:
      'Why most marketing fails: a structure problem, not a content problem',
    excerpt:
      "The businesses we work with rarely have a content problem. They have a structure problem. Here's how to tell the difference — and what to do about it.",
    cover:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&auto=format',
    category: 'Positioning',
    status: 'published' as const,
    content: `## The symptom looks like content

When marketing isn't working, the first instinct is almost always to "make more content." Post more on social. Run more ads. Refresh the website. Add a podcast.

This rarely fixes anything. The problem is usually structural, not creative.

## The real diagnosis

Ask three questions before producing another asset:

1. **Can the business be explained in one sentence that the buyer actually wants?** If not, more content amplifies confusion.
2. **Does attention have somewhere to go?** A landing page, a calendar, a clear next step — without it, ads burn money.
3. **What happens after someone shows interest?** Without follow-up, qualified leads cool off in a day.

If any of these are no, the answer isn't more content. It's structure.

## What structure means

- **Positioning** — what the business is, who it's for, why it matters.
- **Distribution** — where attention is found, in what context, at what frequency.
- **Conversion path** — how attention becomes interest, interest becomes a conversation, and a conversation becomes revenue.
- **Follow-up system** — what happens after the first touch, automated and reliable.

Content is the surface. Structure is what holds it together. Build the structure first, and the same content suddenly works.

## A useful test

For each piece of marketing you have running right now, trace the path from "stranger sees it" to "money in the business." If any step in that path is fuzzy, that's where to focus next — not on more content for the top of the funnel.`,
  },
  {
    slug: 'positioning-before-production',
    title: 'Positioning comes first. Production is the easy part.',
    excerpt:
      'Beautiful content for a business that hasn’t clarified its position is expensive decoration. Position first, then produce.',
    cover:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1280&h=720&fit=crop&auto=format',
    category: 'Strategy',
    status: 'published' as const,
    content: `## The expensive shortcut

A common pattern: a business spends $50k on a beautiful brand film, runs it for a quarter, and sees no measurable lift. The film looks great. The metrics don't move.

Almost every time we audit one of these, the same root cause shows up: **the business never clarified its position before they produced**.

## What positioning actually is

Positioning is not a tagline. It's a clear answer to:

- **Who is this for?** Not "everyone who needs marketing" — a specific buyer with a specific situation.
- **What problem does this solve?** The buyer's problem, in their own words.
- **Why this business, not any other?** The honest, defensible reason.
- **What does the buyer need to believe before they'll act?** This is the one most businesses skip.

Without these answers, every piece of content has to do the explaining itself — which makes it bloated, generic, and forgettable.

## With positioning, production is easy

When positioning is sharp, content writes itself. The video brief is one paragraph. The landing page headline is obvious. The ad creative is a riff on a single core idea.

Without it, every brief becomes a fight, every revision drags, and the final asset still doesn't land.

## The order of operations

1. **Position** — until you can explain the business in one sentence the buyer wants to read.
2. **Audit** — what already exists, what's missing, what's confusing.
3. **Produce** — focused on the message, not the format.
4. **Distribute** — to the audience you actually want, in the context they're already in.
5. **Connect** — to a path that turns interest into a conversation.

This order is boring. It also works.`,
  },
  {
    slug: 'creative-without-systems',
    title: "Creative without systems: why great content still doesn't convert",
    excerpt:
      'Beautiful work is necessary but not sufficient. The systems behind it decide whether attention ever turns into revenue.',
    cover:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1280&h=720&fit=crop&auto=format',
    category: 'Systems',
    status: 'published' as const,
    content: `## The disconnect

We talk to a lot of businesses with great content and bad outcomes. Their videos look like they came from a top-tier production house. Their photography is editorial. Their social feed is enviable.

Their pipeline is empty.

## Where the gap shows up

Walk the path a real buyer takes:

- They see a piece of content. ✅ Beautiful.
- They click through. ✅ Site loads cleanly.
- They want to know more. ❓ No clear next step.
- They submit a form. ❓ No autoresponder, no calendar.
- They wait. ❌ Three days pass.
- They forget.

The content did its job. The system didn't exist. The buyer leaves.

## What "system" actually means

It's unglamorous infrastructure:

- **A landing page that converts** — clear offer, clear ask, one path forward.
- **A CRM that captures every inquiry** — not five spreadsheets and an email inbox.
- **Automated follow-up** — within minutes, not days.
- **A calendar that books itself** — not a back-and-forth chain of emails.
- **A reporting layer** — so you can see what's working and what isn't.

None of this is creative work. All of it determines whether creative work pays off.

## How to think about the investment

Every dollar spent on creative without the system behind it is a dollar spent on awareness — which is fine, but rarely what the business actually needed.

If the brief is "we need to grow," start with the system. The content will work harder against the same audience, the same budget, the same effort.`,
  },
  {
    slug: 'distribution-is-half-the-work',
    title: 'Distribution is half the work — and almost always under-invested',
    excerpt:
      'Most teams spend 80% of their budget producing the asset and 20% getting it in front of people. That ratio is upside down.',
    cover:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&auto=format',
    category: 'Distribution',
    status: 'published' as const,
    content: `## The asset is not the product

Brands spend months on a flagship video. It's beautiful. It's strategic. It cost real money.

Then it gets posted once, runs for two weeks, and quietly disappears under the next thing the team is producing.

This is the most common waste in marketing — and it's almost never a creative problem.

## The 50/50 rule

If you're producing a hero asset (a brand film, a campaign launch, a major case study), budget the same amount of money and effort on **getting it in front of people** as you spent making it.

That sounds extreme. It isn't. It's just honest about how attention works in 2026:

- The average buyer needs to see something **7–14 times** before they act on it.
- Algorithms reward consistency and depth, not novelty.
- Your audience isn't all in the same place — you need to be in their feed, their inbox, their podcast queue, and their broker's email.

## What "distribution work" actually looks like

For a single hero asset, plan for:

- **Cutdowns** — 60s, 30s, 15s, 6s for ads; vertical reels; story slices.
- **Paid placement** — Meta, LinkedIn, YouTube pre-roll, programmatic where it makes sense.
- **Owned channels** — email, SMS, newsletter, podcast plug, sales decks.
- **Earned + partner** — broker outreach, PR pitch, influencer/operator drops.
- **Repurposing schedule** — the asset reappears in different forms over 90 days, not 14.

## A test for your last big campaign

Pull up the analytics from your last big launch. Ask three questions:

1. How many cutdowns did the hero asset generate? (If under 5, you under-distributed.)
2. How much of the budget went to paid placement vs. production? (If production is more than 60%, the ratio is off.)
3. How long after launch was the asset still actively running somewhere? (If under 30 days, you cut the cycle short.)

The fix isn't a bigger budget. It's a better split.`,
  },
  {
    slug: 'crm-is-marketing',
    title:
      "CRM is a marketing function — most businesses don't treat it that way",
    excerpt:
      'The handoff between marketing and sales is where most leads die. The fix is treating CRM as marketing infrastructure, not a sales tool.',
    cover:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1280&h=720&fit=crop&auto=format',
    category: 'Systems',
    status: 'published' as const,
    content: `## The handoff is where leads die

A typical small business runs marketing and sales as two separate islands. Marketing generates the interest, drops the lead into a form, and considers its job done. Sales picks up the lead two days later — by which point the buyer's moved on.

The "handoff" sounds like a sales problem. It isn't. It's a **system problem**, and it lives in the CRM.

## What a marketing-grade CRM does

A CRM treated as a marketing tool, not just a contact database, does five things:

1. **Captures** every inquiry, from every channel, into one record.
2. **Qualifies** automatically — based on form fields, behavior, source — so the team knows what to focus on.
3. **Routes** the right lead to the right person, instantly.
4. **Follows up** automatically — within minutes, with personalized email + SMS sequences.
5. **Reports** back into marketing — which channels produce which kinds of leads, what closes, what doesn't.

Most CRMs are set up for #1 only. Sometimes #4 (a half-built drip). Rarely #2, #3, #5.

## The cost of skipping this

A lead that gets a personalized response **within 5 minutes** is roughly 9× more likely to convert than the same lead getting a reply 24 hours later. (Source: too many studies to count — go google it.)

Most businesses miss this 5-minute window every single day, on every single qualified lead. The team feels busy. The pipeline isn't growing.

## A 1-week fix

You don't need a six-month CRM project to close this gap. In a week:

- **Day 1–2** — connect every inquiry form on the site to a single CRM (HubSpot, Pipedrive, Notion, whatever the team uses).
- **Day 3** — write 3 follow-up email templates (immediate, 24h, 72h).
- **Day 4** — set up an automation: form submit → first email instantly + Slack ping to the team.
- **Day 5** — add an SMS step for high-intent forms (booking requests, callback asks).
- **Days 6–7** — pull a report on what came in, what got opened, what got replied to.

By the end of week 1, you've built a system that catches what was leaking before. Most of the time that alone moves the pipeline meaningfully.

The CRM isn't the boring backend. It's where marketing ROI actually lives.`,
  },
];

// ─── Site Setting (singleton) ────────────────────────────────────────────────
const PAGE_HEROES = [
  {
    page: 'home',
    title: 'We Build The Structure Behind Growth',
    description:
      'Twelve Creative helps businesses clarify their positioning, create stronger content, distribute it with purpose, and install the systems that turn attention into revenue.',
    trust_label: 'Trusted across industries',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: { label: 'View Our Work', href: '/works' },
    video: { source: 'url', value: SAMPLE_VIDEO },
    is_active: true,
  },
  {
    page: 'about',
    label: 'About',
    title:
      'Built for businesses that need strategy and execution in the same room.',
    description:
      'Twelve Creative was built from the belief that creative work should be connected to the business it serves. We exist to close the gap between strategy and execution.',
    is_active: true,
  },
  {
    page: 'works',
    label: 'Work',
    title: 'Work built around business context.',
    description:
      'Our work is not measured by how it looks in isolation. It is measured by whether it helps the business become clearer, more credible, and better equipped to convert attention into action.',
    is_active: true,
  },
  {
    page: 'industries',
    label: 'Industries',
    title:
      'Built for businesses where trust, presentation, and follow-up matter.',
    description:
      'Twelve Creative works across industries where the buying decision depends on credibility, timing, taste, and a clear path to action.',
    is_active: true,
  },
  {
    page: 'what-we-build',
    label: 'What We Build',
    title: 'Marketing works better when the pieces are connected.',
    description:
      'Twelve Creative builds the creative, strategic, and operational pieces that help a business move from visibility to revenue.',
    is_active: true,
  },
  {
    page: 'contact',
    label: 'Contact',
    title: "Let's build something worth building.",
    description:
      'Tell us where the business is and what needs to move. If the project is aligned, we will reach out to schedule a conversation.',
    is_active: true,
  },
  {
    page: 'blogs',
    label: 'Insights',
    title: 'Notes on positioning, creative, and growth systems.',
    description:
      'Field-tested thinking from the work we do for hospitality, real estate, aviation, and professional service operators.',
    is_active: true,
  },
  {
    page: 'process',
    label: 'Our Process',
    title: 'Our process is built around clarity first.',
    description:
      'We do not begin by making random assets. We begin by understanding what the business is trying to move, where the friction is, and what structure needs to be built.',
    is_active: true,
  },
];

async function seedPageHeroes(): Promise<SeedReport> {
  const existing = await PageHero.countDocuments();

  if (existing > 0 && !FORCE) {
    return { module: 'page-hero', action: 'skipped', count: existing };
  }

  if (FORCE) await PageHero.deleteMany({});

  for (const doc of PAGE_HEROES) {
    await PageHero.findOneAndUpdate(
      { page: doc.page },
      { $set: doc },
      { upsert: true },
    );
  }
  return {
    module: 'page-hero',
    action: existing ? 'replaced' : 'inserted',
    count: PAGE_HEROES.length,
  };
}

const SITE_SETTING = {
  contact_email: 'hello@twelvecreative.io',
  contact_phone: '+1 (000) 000-0000',
  contact_address: 'New York, NY',
  booking_notification_email: 'hello@twelvecreative.io',
  social: {
    instagram: 'https://www.instagram.com/twelvecreative',
    linkedin: 'https://www.linkedin.com/company/twelvecreative',
    youtube: 'https://www.youtube.com/@twelvecreative',
    x: 'https://x.com/twelvecreative',
  },
  faq_section: {
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
    image_alt: 'Carlos Doce — Founder of Twelve Creative',
    title: 'Have more questions?',
    description:
      "Let's talk it out. Tell us where the business is now and what needs to move next. If the project is aligned, we'll schedule a conversation.",
    name: 'Carlos Doce',
    position: 'Founder, Twelve Creative',
    contact_link: '/contact',
  },
  // C1: Calendly booking URL — replace with real Calendly link once provided by client
  calendly_url: '',
  // C4: Process section thumbnail — sticky left column in the Process section
  process_thumbnail:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=898&fit=crop&auto=format',
  // C5: "How we structure" section visual asset — shown in The Twelve Creative Difference section
  how_we_structure_image:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1280&h=720&fit=crop&auto=format',
  // C6: TC Meeting scene / founder photo — shown in the About page founder section
  meeting_scene_image:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&auto=format',
  // C7: "Merging Art and Science" story section content
  content_section: {
    title: 'Merging Art and Science',
    subtitle: 'Our Story',
    body: 'Our journey of combining creative excellence with backend growth infrastructure.',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=768&fit=crop&auto=format',
  },
};

// ─── Runner ──────────────────────────────────────────────────────────────────

interface SeedReport {
  module: string;
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
}

async function seedModule<T>(
  name: string,
  model: {
    countDocuments: (filter: object) => { exec: () => Promise<number> };
    deleteMany: (filter: object) => Promise<unknown>;
    insertMany: (docs: T[]) => Promise<unknown[]>;
  },
  docs: T[],
): Promise<SeedReport> {
  const existing = await model
    .countDocuments({ is_deleted: { $ne: true } })
    .exec();

  if (existing > 0 && !FORCE) {
    return { module: name, action: 'skipped', count: existing };
  }

  if (FORCE) {
    await model.deleteMany({});
  }

  await model.insertMany(docs);
  return {
    module: name,
    action: FORCE && existing > 0 ? 'replaced' : 'inserted',
    count: docs.length,
  };
}

async function seedSiteSetting(): Promise<SeedReport> {
  const existing = await SiteSetting.findOne();

  if (existing && !FORCE) {
    return { module: 'site-setting', action: 'skipped', count: 1 };
  }

  if (existing && FORCE) {
    await SiteSetting.deleteMany({});
  }

  await SiteSetting.create(SITE_SETTING);
  return {
    module: 'site-setting',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}

async function run(): Promise<void> {
  console.log(
    FORCE
      ? '⚠️  --force enabled — existing data in each module will be replaced.'
      : 'ℹ️  Safe mode — modules with existing data will be skipped (use --force to override).',
  );

  await initializeDB();

  try {
    const reports: SeedReport[] = [];

    // Insights use save() hooks (read_minutes, published_at) — can't use insertMany for them.
    const insightCount = await Insight.countDocuments({
      is_deleted: { $ne: true },
    });
    if (insightCount > 0 && !FORCE) {
      reports.push({
        module: 'insight',
        action: 'skipped',
        count: insightCount,
      });
    } else {
      if (FORCE) await Insight.deleteMany({});
      for (const doc of INSIGHTS) {
        await Insight.create(doc);
      }
      reports.push({
        module: 'insight',
        action: FORCE && insightCount > 0 ? 'replaced' : 'inserted',
        count: INSIGHTS.length,
      });
    }

    reports.push(await seedModule('testimonial', Testimonial, TESTIMONIALS));
    reports.push(
      await seedModule('showcase-video', ShowcaseVideo, SHOWCASE_VIDEOS),
    );
    reports.push(
      await seedModule('featured-project', FeaturedProject, FEATURED_PROJECTS),
    );
    reports.push(await seedModule('service', Service, SERVICES));
    reports.push(await seedModule('industry', Industry, INDUSTRIES));
    reports.push(await seedModule('brand', Brand, BRANDS));
    reports.push(await seedModule('faq', Faq, FAQS));
    reports.push(await seedModule('team-member', TeamMember, TEAM));
    reports.push(await seedModule('work', Work, WORKS));
    reports.push(await seedPageHeroes());
    reports.push(await seedSiteSetting());

    console.log('\n📊 Seed report:');
    for (const r of reports) {
      const icon =
        r.action === 'inserted'
          ? '✅'
          : r.action === 'replaced'
            ? '♻️ '
            : '⏭️ ';
      console.log(
        `  ${icon} ${r.module.padEnd(20)} ${r.action.padEnd(10)} ${r.count} doc(s)`,
      );
    }
    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close();
  }
}

run();
