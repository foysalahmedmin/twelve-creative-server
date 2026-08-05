/**
 * Page Hero seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

import { landscapeVideo } from '../lib/sample-media';

export const PAGE_HERO_SEED = [
  {
    page: 'home',
    title: 'We Build The Structure Behind Growth',
    description:
      'Twelve Creative helps businesses clarify their positioning, create stronger content, distribute it with purpose, and install the systems that turn attention into revenue.',
    trust_label: 'Trusted across industries',
    primary_cta: { label: 'Start a Conversation', href: '/contact' },
    secondary_cta: { label: 'View Our Work', href: '/works' },
    video: landscapeVideo(),
    seo: {
      title: 'Twelve Creative — We Build the Structure Behind Growth',
      description:
        'Twelve Creative builds positioning, creative, distribution, and conversion systems into one connected structure for growth.',
      canonical_url: 'https://twelvecreative.io',
      og_image: '/og-image.jpg',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'about',
    label: 'About',
    title:
      'Built for businesses that need strategy and execution in the same room.',
    description:
      'Twelve Creative was built from the belief that creative work should be connected to the business it serves. We exist to close the gap between strategy and execution.',
    seo: {
      title: 'About Twelve Creative | Strategy, Creative & Systems',
      description:
        'Learn how Twelve Creative connects strategy, creative execution, and growth systems.',
      canonical_url: 'https://twelvecreative.io/about',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'works',
    label: 'Work',
    title: 'Work built around business context.',
    description:
      'Our work is not measured by how it looks in isolation. It is measured by whether it helps the business become clearer, more credible, and better equipped to convert attention into action.',
    seo: {
      title: 'Work | Twelve Creative Case Studies',
      description:
        'Explore Twelve Creative case studies across positioning, campaigns, content, websites, and conversion systems.',
      canonical_url: 'https://twelvecreative.io/works',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'industries',
    label: 'Industries',
    title:
      'Built for businesses where trust, presentation, and follow-up matter.',
    description:
      'Twelve Creative works across industries where the buying decision depends on credibility, timing, taste, and a clear path to action.',
    seo: {
      title: 'Industries | Twelve Creative',
      description:
        'Industry-focused growth systems for hospitality, real estate, ventures, and professional services.',
      canonical_url: 'https://twelvecreative.io/industries',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'what-we-build',
    label: 'What We Build',
    title: 'Marketing works better when the pieces are connected.',
    description:
      'Twelve Creative builds the creative, strategic, and operational pieces that help a business move from visibility to revenue.',
    seo: {
      title: 'What We Build | Positioning, Creative, Websites, Ads & CRM',
      description:
        'Explore connected positioning, creative, websites, distribution, CRM, automation, and growth support.',
      canonical_url: 'https://twelvecreative.io/what-we-build',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'contact',
    label: 'Contact',
    title: "Let's build something worth building.",
    description:
      'Tell us where the business is and what needs to move. If the project is aligned, we will reach out to schedule a conversation.',
    seo: {
      title: 'Contact Twelve Creative | Start a Conversation',
      description:
        'Start a conversation about positioning, creative, campaigns, websites, CRM, automation, and growth systems.',
      canonical_url: 'https://twelvecreative.io/contact',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'faq',
    label: 'FAQ',
    title: 'Frequently Asked Questions',
    description:
      'Clear answers about how we work, who we work with, and what to expect from an engagement.',
    seo: {
      title: 'Frequently Asked Questions | Twelve Creative',
      description:
        "Answers about Twelve Creative's services, process, engagements, pricing, and industry experience.",
      canonical_url: 'https://twelvecreative.io/faq',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'insights',
    label: 'Insights',
    title: 'Notes on positioning, creative, and growth systems.',
    description:
      'Field-tested thinking from the work we do for hospitality, real estate, ventures, and professional service operators.',
    seo: {
      title: 'Insights | Twelve Creative',
      description:
        'Notes on positioning, creative, distribution, and the systems behind real business growth.',
      canonical_url: 'https://twelvecreative.io/blogs',
      no_index: false,
    },
    is_active: true,
  },
  {
    page: 'process',
    label: 'Our Process',
    title: 'Our process is built around clarity first.',
    description:
      'We do not begin by making random assets. We begin by understanding what the business is trying to move, where the friction is, and what structure needs to be built.',
    seo: {
      title: 'Process | How Twelve Creative Builds Growth Systems',
      description:
        'How Twelve Creative moves from diagnostics and positioning through creative, systems, launch, and optimization.',
      canonical_url: 'https://twelvecreative.io/process',
      no_index: false,
    },
    is_active: true,
  },
];
