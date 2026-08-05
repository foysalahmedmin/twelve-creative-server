/**
 * Team Member seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

export const TEAM_MEMBER_SEED = [
  {
    name: 'Carlos Doce',
    role: 'Founder, Twelve Creative',
    bio: 'Founder of Twelve Creative. 15+ years across film, production, and growth systems. NYU film + business.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&auto=format',
    socials: {
      linkedin: 'https://www.linkedin.com/in/carlos-a-doce',
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
