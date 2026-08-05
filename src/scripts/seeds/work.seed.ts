/**
 * Work seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

import { landscapeVideo } from '../lib/sample-media';

export const WORK_SEED = [
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
    outcome_video: landscapeVideo(),
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
    outcome_video: landscapeVideo(),
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
    outcome_video: landscapeVideo(),
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
