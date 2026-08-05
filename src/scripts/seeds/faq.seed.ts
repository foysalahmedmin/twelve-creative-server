/**
 * Faq seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

export const FAQ_SEED = [
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
