/**
 * Site Setting seed data for a fresh install.
 *
 * Consumed by seeds/initial.seed.ts — kept here so the runner stays readable
 * and each module's demo content can be edited on its own.
 */

export const SITE_SETTING_SEED = {
  contact_email: 'carlos@twelvecreative.io',
  contact_phone: '+1 (951) 822-6223',
  contact_address: '2121 NW 1st Place, Suite 203, Miami, FL 33127',
  contact_whatsapp: '+1 (951) 822-6223',
  contact_map_embed_url:
    'https://maps.google.com/maps?q=2121+NW+1st+Place,+Miami,+FL+33127&t=&z=14&ie=UTF8&iwloc=&output=embed',
  booking_notification_email: 'carlos@twelvecreative.io',
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
  contact_page: {
    inquiry: {
      label: 'Send an Inquiry',
      title: 'Tell us what needs to move.',
      description:
        'Whether the issue is unclear positioning, weak content, poor follow-up, a website that does not convert, or a campaign that needs structure — the first step is understanding the business.',
    },
    booking: {
      label: 'Schedule a Call',
      title: 'Pick a time that works for you.',
      description:
        "Skip the form and book a 30-minute call directly. We'll talk through where the business is, what you're trying to move, and whether the project is a fit.",
    },
    map: {
      label: 'Visit / Mail Us',
      title: 'Based in Miami.',
      description:
        'We work with operators across hospitality, real estate, ventures, and professional services — based in Miami with reach across the US.',
    },
  },
  footer: {
    description:
      'Twelve Creative builds positioning, creative, distribution, websites, CRM, and automation systems for businesses that need a clearer path from attention to revenue.',
    cta_text: 'Ready to build the structure behind your growth?',
    cta_label: 'Start a conversation',
    cta_href: '/contact',
  },
};
