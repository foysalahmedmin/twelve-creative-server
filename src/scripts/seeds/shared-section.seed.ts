import { SharedSection } from '../../modules/shared-section/shared-section.model';
import { normalizeSharedSection } from '../../modules/shared-section/shared-section.service';
import {
  TSharedSection,
  TSharedSectionInput,
} from '../../modules/shared-section/shared-section.type';

export const SHARED_SECTION_SEED_INPUT: TSharedSectionInput[] = [
  {
    key: 'difference',
    label: 'Twelve Creative Effect',
    title: 'Creative is only valuable when it is connected to the business.',
    description:
      'Most companies separate creative, ads, websites, and follow-up systems into different vendors. The result is often fragmented. We build these pieces together so the business has a clearer path from attention to revenue.',
    content: {
      fragmented: {
        title: 'Fragmented approach',
        items: [
          { id: 'strong-visuals', text: 'Strong visuals with no backend' },
          { id: 'unclear-offer', text: 'Ads without a clear offer' },
          {
            id: 'non-converting-websites',
            text: 'Websites that look good but do not convert',
          },
          { id: 'lost-leads', text: 'Leads that fall through the cracks' },
          { id: 'vendor-silos', text: 'Vendors managed in silos' },
        ],
      },
      connected: {
        title: 'Connected system',
        items: [
          {
            id: 'positioning-assets',
            text: 'Positioning that informs every asset',
          },
          { id: 'offer-creative', text: 'Creative built around the offer' },
          {
            id: 'converting-websites',
            text: 'Websites engineered to convert',
          },
          {
            id: 'capturing-demand',
            text: 'CRM and automations capturing demand',
          },
          { id: 'one-system', text: 'One team, one operating system' },
        ],
      },
    },
    is_active: true,
  },
  {
    key: 'why-choose-us',
    label: 'Why Twelve Creative',
    title: 'Built for businesses with real ambition.',
    description:
      'The work is measured by whether the business becomes easier to understand, easier to trust, and easier to buy from — not by how much marketing activity gets produced.',
    content: {
      features: [
        {
          id: 'strategy',
          icon: 'strategy',
          title: 'Strategy in the same room',
          description:
            'Creative decisions are made next to business decisions, not in isolation from them.',
        },
        {
          id: 'cinematic',
          icon: 'cinematic',
          title: 'Cinematic creative',
          description:
            '15+ years of production experience shaping content that feels credible and worth attention.',
        },
        {
          id: 'connected',
          icon: 'connected',
          title: 'Distribution with intent',
          description:
            'Campaigns built around the audience, offer, and the action we want them to take.',
        },
        {
          id: 'systems',
          icon: 'systems',
          title: 'Systems that actually run',
          description:
            'CRM, automations, and follow-up that capture demand instead of letting it leak out.',
        },
        {
          id: 'outcomes',
          icon: 'outcomes',
          title: 'Outcomes over activity',
          description:
            'The work is measured by whether the business becomes easier to understand and easier to buy from.',
        },
        {
          id: 'embedded',
          icon: 'embedded',
          title: 'Embedded partnership',
          description:
            "We operate as the marketing department the business needs, not a vendor at arm's length.",
        },
      ],
    },
    is_active: true,
  },
  {
    key: 'growth-system',
    label: 'Inside the Build',
    title: 'How we structure a growth system end-to-end.',
    description:
      'Most marketing fails because the pieces are not connected. Here is how Twelve Creative builds positioning, creative, distribution, and conversion as one working system.',
    content: {
      steps: [
        {
          id: 'positioning',
          title: 'Positioning the Business',
          description:
            'Before content, ads, or websites, we clarify what the business is, who it serves, and the angle the market needs to believe.',
          media: {
            type: 'image',
            image:
              'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=552&fit=crop&auto=format',
          },
          items: [
            { id: 'messaging', text: 'Brand messaging and offer structure' },
            { id: 'founder-position', text: 'Founder or company positioning' },
            { id: 'market-angle', text: 'Market differentiation and angle' },
          ],
        },
        {
          id: 'creative',
          title: 'Creative Production',
          description:
            'We produce the assets that make the business feel credible, relevant, and worth attention — from brand films to founder content.',
          media: {
            type: 'image',
            image:
              'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=768&h=552&fit=crop&auto=format',
          },
          items: [
            { id: 'brand-films', text: 'Brand films and campaign assets' },
            { id: 'founder-event', text: 'Founder-led and event coverage' },
            {
              id: 'industry-content',
              text: 'Restaurant, real estate, and aviation content',
            },
          ],
        },
        {
          id: 'distribution',
          title: 'Distribution with Intent',
          description:
            'Creative only matters if it reaches the right people. We design campaigns around the audience, offer, and desired action.',
          media: {
            type: 'image',
            image:
              'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=768&h=552&fit=crop&auto=format',
          },
          items: [
            { id: 'meta-ads', text: 'Meta ads and retargeting' },
            { id: 'email-sms', text: 'Email and SMS campaigns' },
            { id: 'launch-pr', text: 'Launch and PR coordination' },
          ],
        },
        {
          id: 'conversion',
          title: 'Conversion Systems',
          description:
            'Attention needs somewhere to go. We install landing pages, CRM, and automations that capture demand and follow up properly.',
          media: {
            type: 'image',
            image:
              'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=768&h=552&fit=crop&auto=format',
          },
          items: [
            { id: 'lead-capture', text: 'Landing pages and lead capture' },
            { id: 'crm-followup', text: 'CRM, automations, and follow-up' },
            { id: 'reporting', text: 'Tracking and reporting' },
          ],
        },
      ],
    },
    is_active: true,
  },
  {
    key: 'scroll-statement',
    title:
      'Make the business understood. Then construct the system that converts attention into revenue.',
    description:
      'Positioning, cinema-level creative, distribution, CRM, automation, and conversion logic are integrated from the start.',
    content: {
      paragraphs: [
        {
          id: 'connected-foundation',
          segments: [
            { id: 'positioning', text: 'Positioning, ' },
            {
              id: 'creative',
              text: 'cinema-level creative',
              highlight: true,
            },
            {
              id: 'distribution',
              text: ', and distribution are built together with the systems behind them. ',
            },
            {
              id: 'conversion',
              text: 'CRM, automation, and conversion logic',
              highlight: true,
            },
            { id: 'integrated', text: ' integrated from the start.' },
          ],
        },
        {
          id: 'controlled-scale',
          segments: [
            {
              id: 'demand',
              text: 'Demand is generated, qualified, and directed into revenue. The result is a business that is understood immediately and ',
            },
            { id: 'scale', text: 'scales with control', highlight: true },
            { id: 'period', text: '.' },
          ],
        },
      ],
    },
    is_active: true,
  },
  {
    key: 'work-with-us',
    title: 'Work With Us',
    description:
      'Every engagement follows a clear three-phase structure built around the business.',
    content: {
      cards: [
        {
          id: 'how-we-work',
          title: 'How We Work',
          description:
            'Every engagement follows the same three-phase structure — intelligence, execution, and refinement. No guesswork, no generic playbooks. Just a clear system built around your business.',
        },
        {
          id: 'market-intelligence',
          title: 'Market Intelligence',
          description:
            'We study the business, audience, competition, and market conditions before building anything. The goal is to understand what drives demand, what creates trust, and where the clearest opportunity exists.',
        },
        {
          id: 'strategy-systems',
          title: 'Strategy Into Systems',
          description:
            'We turn the intelligence into a working growth system: messaging, landing pages, CRM, ads, email, SMS, tracking, and follow-up. Everything is built so attention has somewhere to go.',
        },
        {
          id: 'optimization-advisory',
          title: 'Optimization & Advisory',
          description:
            'Once the system is in motion, we monitor performance, streamline what is working, report what matters, maintain the infrastructure, and continue advising the business as new opportunities appear.',
        },
      ],
    },
    is_active: true,
  },
  {
    key: 'home-services',
    label: 'Our Services',
    title: 'Services Built to Move the Business',
    description:
      'We help businesses build positioning, creative, and systems that turn attention into revenue.',
    content: {},
    is_active: true,
  },
  {
    key: 'home-featured-projects',
    label: 'Our Works',
    title: 'Featured Projects',
    description:
      'Real projects that show how strategy, creative, and systems work together.',
    content: {},
    is_active: true,
  },
  {
    key: 'home-industries',
    label: 'Industries',
    title: 'Industries We Work With',
    description:
      'We work across industries where the buying decision depends on credibility, timing, taste, and a clear path to action.',
    content: {},
    is_active: true,
  },
  {
    key: 'testimonials',
    label: 'Client Voices',
    title: 'Built for operators who need real outcomes.',
    description:
      'Hospitality groups, developers, aviation founders, and professional service firms — clients who needed structure behind the marketing.',
    content: {},
    is_active: true,
  },
  {
    key: 'faq',
    label: 'FAQ',
    title: 'Frequently Asked Questions',
    description: 'Everything you need to know before we get started.',
    content: {},
    is_active: true,
  },
  {
    key: 'core-verticals',
    label: 'Industries',
    title: 'Core Verticals',
    description:
      'We work across a focused set of industries where marketing structure, creative execution, and conversion systems make the biggest difference.',
    content: {},
    is_active: true,
  },
  {
    key: 'work-showcase',
    label: 'Work Showcase',
    title: 'Work built around business context.',
    description:
      'Our work is measured by whether the business becomes clearer, more credible, and better equipped to convert attention into action.',
    content: {},
    is_active: true,
  },
  {
    key: 'visual-library',
    label: 'Visual Library',
    title: 'A live look at the work.',
    description:
      'Frames from recent campaigns — content, ads, and brand assets built to perform.',
    content: {},
    is_active: true,
  },
];

export const SHARED_SECTION_SEED: TSharedSection[] =
  SHARED_SECTION_SEED_INPUT.map(normalizeSharedSection);

export type TSharedSectionSeedReport = {
  module: 'shared-sections';
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
};

export async function seedSharedSections(
  force: boolean,
): Promise<TSharedSectionSeedReport> {
  if (force) {
    await SharedSection.deleteMany({});
    await SharedSection.insertMany(SHARED_SECTION_SEED);
    return {
      module: 'shared-sections',
      action: 'replaced',
      count: SHARED_SECTION_SEED.length,
    };
  }

  const existing = await SharedSection.find().select('key -_id').lean();
  const keys = new Set(existing.map((item) => item.key));
  const missing = SHARED_SECTION_SEED.filter((item) => !keys.has(item.key));
  if (!missing.length) {
    return {
      module: 'shared-sections',
      action: 'skipped',
      count: SHARED_SECTION_SEED.length,
    };
  }

  await SharedSection.insertMany(missing);
  return {
    module: 'shared-sections',
    action: 'inserted',
    count: missing.length,
  };
}
